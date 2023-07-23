const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'Review cannot be empty!'],
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    // Parent refrencing :
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour', // or "tourModel" ?
      required: [true, 'Review must belong to a tour.'],
    },
    // Parent refrencing :
    user: {
      // Who wrote the review.
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Review must belong to a user.'],
    },
  },
  {
    // When something calls JSON.stringify() on a Mongoose object, it will internally call the toJSON method we define on the schema. The toObject() method is for converting a Mongoose object to a regular JavaScript object. For example, when you console.log a Mongoose object it calls the toObject method internally.
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// populate : When we query for the reviews we get this information :
reviewSchema.pre(/^find/, function (next) {
  //   this.populate({
  //     // this. always points to the current query.
  //     path: 'tour',
  //     select: 'name', // Only send the relevant data --> which is here the "name".
  //   }).populate({
  //     path: 'user',
  //     select: 'name photo',
  //   });

  this.populate({
    path: 'user',
    select: 'name photo',
  });

  next();
});

const ReviewModel = mongoose.model('Review', reviewSchema);

module.exports = ReviewModel;
