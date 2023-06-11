// const util = require('util'); // built in promisify
const { promisify } = require('util'); // ES6 destructring it :
const jwt = require('jsonwebtoken');
const catchAsync = require('../utils/catchAsync');
const userModel = require('../models/userModel');
const { createUser } = require('./userController');
const AppError = require('../utils/appError');
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
  //   3)  if everything is correct send token to client  :
  const token = signToken(user._id);
  res.status(200).json({ status: 'success', token });
});

// MiddleWare :
exports.protect = catchAsync(async (req, res, next) => {
  // 1) Get JWT Token & Check if its there :
  let token;
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
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  //   console.log('decoded = ', decoded);

  // 3) Check if user still exist :
  const currentUser = await userModel.findById(decoded.id);
  console.log('decoded.id = ', currentUser);
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
  req.user = currentUser;
  next();
});

// eplained in apple notes :
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You dont have permission to perform this action', 403)
      );
    }
    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1) get user posted email :
  const user = await userModel.findOne({ email: req.body.email });
  // verify if the user exists :
  if (!user) {
    return next(AppError('There is no user with email address'));
  }

  // 2) genrate random token :
});

exports.resetPassword = (req, res, next) => {};
