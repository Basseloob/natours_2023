const fs = require('fs');
const userModel = require('../models/userModel');
const APIFeatures = require('../utils/apiFeatures');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

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
