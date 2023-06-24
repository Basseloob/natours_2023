// const util = require('util'); // built in promisify
const crypto = require('crypto'); // built in nodejs :
const { promisify } = require('util'); // ES6 destructring it :
const jwt = require('jsonwebtoken');
const catchAsync = require('../utils/catchAsync');
const userModel = require('../models/userModel');
const { createUser } = require('./userController');
const AppError = require('../utils/appError');
const sendEmail = require('../utils/email');

const { decode } = require('punycode');

const signToken = (id) => {
  return jwt.sign(
    // { id: newUser._id }, // Here is the data we want store inside the token.
    { id: id },
    process.env.JWT_SECRET,
    // options
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );
};

// Create User :
exports.signup = catchAsync(async (req, res, next) => {
  //   const newUser = await userModel.create(req.body); // Like this everybody can be signed as ADMIN : we could do another route to signUp ADMIN users :
  const newUser = await userModel.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    passwordChangedAt: req.body.passwordChangedAt,
    role: req.body.role,
  });

  // Login user as soon he signed up :
  //   const token = jwt.sign({ id: newUser._id }, 'secret');
  //   const token = jwt.sign(
  //     { id: newUser._id }, // Here is the data we want store inside the token.
  //     process.env.JWT_SECRET,
  //     // options
  //     { expiresIn: process.env.JWT_EXPIRES_IN }
  //   );
  const token = signToken(newUser._id);

  res.status(201).json({ status: 'success', token, data: { user: newUser } });
});

// Login User :
exports.login = catchAsync(async (req, res, next) => {
  // 1) read the email & password fromt he body :
  //   const email = req.body.email;     // object.property
  const { email, password } = req.body; // { property } = object

  //   2) Check if email & password exist :
  if (!email || !password) {
    return next(new AppError('Please provide email & pasword', 400)); // return here to stop the code into the error and just complete :
  }

  //   3) Check if email & password is correct :
  const user = await userModel.findOne({ email }).select('+password'); // select here to include the password with it :
  console.log('The Signed in user is : ', user);

  // Comparing the password with hashed bcrypt password inside userModel file :
  //   const correct = await user.correctPassword(password, user.password); // the 2 arguments is the ( candidatePassword , userPassword );

  //   if (!user || !correct) {
  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password', 401));
  }
  //   3)  If everything is correct send token to client  :
  const token = signToken(user._id);
  res.status(200).json({ status: 'success', token });
});

// MiddleWare :
let token;

exports.protect = catchAsync(async (req, res, next) => {
  // 1) Get JWT Token & Check if its there :
  // let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1]; // split Beare from the token number and take the second in the array which is the token number.
  }
  //   console.log('JWT Token & Check if its there = ', token);

  if (!token) {
    return next(
      new AppError('You are not logged in! Please log in to get access.', 404)
    );
  }

  // 2) Verification JWT token ;
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET); // from the documentation.
  // console.log('decoded = ', decoded);

  // 3) Check if user still exist :
  const currentUser = await userModel.findById(decoded.id);
  // console.log('decoded.id || currentUser = ', currentUser);
  if (!currentUser) {
    return next(
      new AppError(
        'The user belonging to this token does no longer exist! ',
        401
      )
    );
  }

  // 4) Check if user changed password after the JWT Token was issued :
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError('User recently changed password! Please log in again.', 401)
    );
  }

  // Grant ACCESS TO PROTECTED ROUTE :
  req.user = currentUser; // this is crucial for the next restrictedTo step :
  next();
});

// Explained in apple notes :
exports.restrictTo = (...roles) => {
  console.log('Restricted Route ');

  return (req, res, next) => {
    // 1) Get JWT Token & Check if its there :
    // let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1]; // split Beare from the token number and take the second in the array which is the token number.
    }

    // roles ['admin', 'lead-guide']. role='user'
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You dont have permission to perform this action', 403)
      );
    }
    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1) get user posted email from the body:
  const user = await userModel.findOne({ email: req.body.email });
  // verify if the user exists in the DB:
  if (!user) {
    return next(new AppError('There is no user with email address', 404));
  }

  // 2) generate random token :
  const resetToken = user.createPasswordResetToken();
  // save the generated token to DB :
  await user.save({ validateBeforeSave: false });

  // 3) Send it to user's email :
  const resetURL = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/users/resetPassword/${resetToken}`;

  const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${resetURL}.\nIf you didn't forget your password, please ignore this email!`;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Your password reset token (valid for 10 min)',
      message,
    });

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email!',
    });
  } catch (err) {
    console.log(err);

    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError('There was an error sending the email. Try again later!'),
      500
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on the token : the one sent from the URl is not encrypted ,while whats in the server is encrypted :
  // encrypt the token and compare it with the one in the DB :
  const hashToken = crypto
    .createHash('sha256')
    .update(req.params.token) // its the URL /resetPassword/:token
    .digest('hex');

  // Get the user based on this token & Cheking the pasowerd expiration date :
  const user = await userModel.findOne({
    passwordResetToken: hashToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  // 2) If token has not expired, and there is user, set the new password :
  if (!user) {
    return next(new AppError('Token is invalid or has expired.', 400));
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined; // deleting it.
  user.passwordResetExpires = undefined; // deleting it.
  await user.save(); // using save to update it for the vlidators.

  // 3) Update changedPasswordAt property for the user :

  // 4) Log the user in, send JWT :
  // If everything is correct send token to client  :
  const token = signToken(user._id);
  res.status(200).json({ status: 'success', token });
});
