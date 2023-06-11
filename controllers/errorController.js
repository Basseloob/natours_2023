const AppError = require('../utils/appError');

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  console.log(message);
  return new AppError(message, 400);
};

const handleDoublicateFieldsErrorDB = (err) => {
  const value = err.keyValue.name;
  console.log('The Doublicated name is : ', value);

  const message = `Doublicate field value : ${err.keyValue.name}. Please use another value!`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = (err) => {
  // looping through the error Eg : name , difficulty & ratingsAvergae.
  const errors = Object.values(err.errors).map((el) => el.message);

  const message = `Invalid input data. ${errors.join('-_-_-_-_-_-')}`;
  return new AppError(message, 400);
};

const handleJWTError = (err) =>
  new AppError('Invalid token. Please login again!', 401);

const handleJWTExpiredError = (err) =>
  new AppError('Your token has expired! Please login again .', 401);

const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    err: err,
    message: err.message,
    stack: err.stack,
  });
};

const sendErrorPro = (err, res) => {
  // Operational, trusted error: send message to clinet.
  if (err.isOperational) {
    console.log('🔥 This error is for the client !!! , in POSTMAN App .');

    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });

    // Programming or other unkown error: dont leak error details.
  } else {
    // 1) Log error :
    console.error('Unkonw Error 🔥', err);

    // 2) Send general message :
    res.status(500).json({
      status: 'error',
      message: 'Something went very wrong!', // validation error of mongoose will be handled here.
    });
  }
};

module.exports = (err, req, res, next) => {
  // 4 argumnet means it an error handler.

  //   console.error(err.stack); // shows where the error occurred.

  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';
  // console.log('err.status = ', err.status);
  // console.log('err.statusCode = ', err.statusCode);

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error = { ...err };
    // let error = Object.create(err);
    if (err.name === 'CastError') error = handleCastErrorDB(error);
    if (error.code === 11000) error = handleDoublicateFieldsErrorDB(error); // when creating new field with the used name.
    if (error._message === 'Validation failed')
      error = handleValidationErrorDB(error); // when updating the fields, the validate mongoose tourModel.
    if (err.name === 'JsonWebTokenError') error = handleJWTError(err);
    if (err.name === 'TokenExpiredError') error = handleJWTExpiredError(err);

    sendErrorPro(error, res);
  }

  // res.status(err.statusCode).json({
  //   status: err.status,
  //   message: err.message,
  // });
};
