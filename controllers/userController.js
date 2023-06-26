const fs = require('fs');
const userModel = require('../models/userModel');
const APIFeatures = require('../utils/apiFeatures');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

const filterObj = (obj, ...allowedFields) => {
  // 1) loop through the fileds that is in the Obj :
  // 2) And then for each field we check if is one of the allowed fields :
  // 3) If its we create a new field ...allowedFields :

  const newObj = {};

  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

const readAllUsers = JSON.parse(
  fs.readFileSync(`${__dirname}/../dev-data/data/users.json`)
);

exports.getAllUsers = catchAsync(async (req, res) => {
  const users = await userModel.find();
  // console.log('req.query : ', req.query, 'queryObj : ', queryObj);

  res.status(200).json({
    status: 'success',

    results: users.length,
    data: {
      users,
    },
  });
});

exports.updateMe = catchAsync(async (req, res, next) => {
  // 1) Create error if user POSTs password data :
  if (req.body.password || req.body.passwordConfirm)
    return next(
      new AppError(
        'This route is not for password updates, Please use / updateMyPassword.',
        400
      )
    );

  // 2) Filtered out unwanted fieldsNAMES that are not allowed to be updated :
  // Only allow to update the 'name' and 'email' - we don't want to the access to ( body.role: 'admin ) :
  const filteredBody = filterObj(req.body, 'name', 'email');

  // 3) Update user document :
  const updatedUser = await userModel.findByIdAndUpdate(
    req.user.id,
    filteredBody,
    {
      new: true,
      runValidators: true, // mongoose will validate our inputs.
    }
  );

  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser,
    },
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  await userModel.findByIdAndUpdate(req.user.id, { active: false });

  console.log('User has been deleted. ');
  res.status(204).json({
    status: 'success',
    data: {},
  });
});

exports.getUser = (req, res) => {
  console.log(req.params);

  const id = req.params.id * 1;
  const findUserId = readAllUsers.find((el) => el.id === id);

  //   if (id > readAllUsers.length) {
  //   if (!findUserId) {
  //     return res.status(404).json({
  //       status: 'fail',
  //       message: 'Invalid ID:',
  //     });
  //   }

  res.status(200).json({
    status: 'success',
    data: {
      findUserId,
    },
  });
};

// exports.getUserByName = (req, res) { }

exports.createUser = (req, res) => {
  console.log(req.body);

  const newId = readAllUsers[readAllUsers.length - 1].id + 1;
  const newUser = Object.assign({ id: newId }, req.body);
  readAllUsers.push(newUser);

  fs.writeFile(
    `${__dirname}/dev-data/data/users.json`,
    JSON.stringify(readAllUsers),
    (err) => {
      res.status(201).json({
        status: 'success',
        data: {
          readAllUsers: newUser,
        },
      });
    }
  );
  //   res.send('Done.');
};

exports.updateUser = (req, res) => {
  //   if (req.params.id * 1 > readAllUsers.length) {
  //     return res.status(404).json({
  //       status: 'fail',
  //       message: 'Invalid ID:',
  //     });
  //   }

  res.status(200).json({
    status: 'success',
    data: {
      readAllUsers: '<updated tour here...>',
    },
  });
};

exports.deleteUser = (req, res) => {
  if (req.params.id * 1 > readAllUsers.length) {
    return res.status(404).json({
      status: 'fail',
      message: 'Invalid ID:',
    });
  }

  res.status(204).json({
    status: 'success',
    data: null,
  });
};
