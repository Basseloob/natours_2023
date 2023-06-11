const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

// // 2: Creating Schema.
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'A tour name is required'],
    // unique: true,
  },
  email: {
    type: String,
    required: [true, 'Please provide your email'],
    unique: true,
    lowercase: true,
    // To use our custome validator :
    validate: [validator.isEmail, 'Please provide a valid email'],
  },
  photo: String,
  // Roles fo accessing a protected route :
  role: {
    type: String,
    enum: ['user', 'admin', 'lead-guide', 'guide'],
    default: 'user',
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 8,
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your password'],
    // To use our cutome validator :
    // No arrow function because we want to use (this.) keyword.
    validate: function (el) {
      // This only works on CREATE & SAVE!!!
      return el === this.password; // passwordConfirm === password.
    },
    message: 'Passwords are not the same!',
  },
  passwordChangedAt: Date,
});

// The encryption is between getting the data and saving it into the DB :
userSchema.pre('save', async function (next) {
  // Only run this function if password was actually modified :
  if (!this.isModified('password')) return next();

  // Encrypting the password with cost of 12 :
  this.password = await bcrypt.hash(this.password, 12);
  // Seleting the passwordConfirm field  // we are removing it here becasue its required as an input but then we remove it here :
  this.passwordConfirm = undefined;
});

// input password VS DB saved password :
userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  // this.password --> will not work becasue of password = false inside the scehma :
  // compare() function will return true if the 2 argument are the same ;
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function (JWTTimesstamp) {
  if (this.passwordChangedAt) {
    const changedTimesstamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    ); // converting the time from this( JWTTimesstamp :  1685966379 )  to this ()

    console.log(
      'this.passwordChangedAt : ',
      // this.passwordChangedAt,
      changedTimesstamp,
      '   &&  JWTTimesstamp : ',
      JWTTimesstamp
    );

    return JWTTimesstamp < changedTimesstamp; // 100 < 200
  }

  return false; // Means :  the user didnt change the password after the token was initiated.
};

userSchema.methods.createPasswordResetToken = function () {};

const userModel = mongoose.model('User', userSchema);
module.exports = userModel;

// testTour
//   .save()
//   .then((doc) => {
//     console.log(doc);
//   })
//   .catch((err) => {
//     console.log('Error saving the doc into the database : ', err);
//   });
