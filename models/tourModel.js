const mongoose = require('mongoose');
const slugify = require('slugify');
const validator = require('validator');

// // 2: Creating Schema.
const tourSchema = new mongoose.Schema(
  // 1) Schema Definitions :
  {
    name: {
      type: String,
      required: [true, 'A tour name is required'],
      unique: true,
      //data validators :
      maxlength: [40, 'A tour name must have less or equal 40 character'],
      minlength: [10, 'A tour name must have more or equal 10 character'],
      // const validator = require('validator');
      // validate: [validator.isAlpha, 'Tour name must onlu contains characters'],
    },
    slug: String,
    duration: { type: Number, required: [true, 'A tour must have duration'] },
    maxGroupSize: {
      type: Number,
      required: [true, 'Max group size is required'],
    },
    difficulty: {
      type: String,
      required: [true, 'Difficulty is required'],
      //data validators :
      enum: {
        values: ['easy', 'medium', 'defficult'],
        message: 'Defficulty is either easy, medium or defficult',
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      //data validators :
      min: [1, 'Rating must be above 1'],
      max: [5, 'Rating must be below 5'],
    },
    ratingQuantity: { type: Number, default: 0 },
    price: { type: Number, required: [true, 'A tour price is required'] },
    priceDiscount: {
      type: Number,
      //Custom validators :
      validate: {
        // this only works when Cearting and SAVING NEW document,,, NOT for Updating.
        validator: function (theUserSpecifiedDiscountValue) {
          return theUserSpecifiedDiscountValue < this.price; // the discount always lower than the price.
        },
        message: 'Discount price ({VALUE}) should be below the price',
      },
    },
    summary: { type: String, trim: true },
    descriptioin: { type: String, trim: true },
    imageCover: { type: String, required: [true, 'A tour image is required'] },
    images: [String],
    createdAt: { type: Date, default: Date.now(), select: false },
    startDates: [Date],
    secretTour: { type: Boolean, default: false }, // ture = Secret , false = notsecret.
  },
  // 2) The Options :
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

//Virtual property with mongoose :  // In Example : used for not to store data into the DB like for the conversion of speed from Miles into Kilometers.
tourSchema.virtual('durationWeek').get(function () {
  // arrow function dont get its this. keyword.
  // get() -> it will be created each time we get some data from the DB.
  return this.duration / 7; // calculating the week.
});

// DOCUMENT MIDDLEWARE : // run before .save() and .create() ONLY.
tourSchema.pre('save', function (next) {
  // console.log(this); // this : points to the document that been saved.
  this.slug = slugify(this.name, { lower: true });
  next();
});

// tourSchema.pre('save', function (next) {
//   console.log('Will save document...');
//   next();
// });

// tourSchema.post('save', function (theSavedDocIntoDB, next) {
//   console.log('theSavedDocIntoDB = ', theSavedDocIntoDB);
//   next();
// });

// QUERY MIDDLEWARE : runs before or after query is exceuted .
tourSchema.pre(/^find/, function (next) {
  // /^find/ this will be triggered by --> find findOne findById every string Starts with find.
  // tourSchema.pre('find', function (next) {
  this.find({ secretTour: { $ne: true } });

  this.start = Date.now();

  next();
});

tourSchema.post(/^find/, function (docsThatReturnedFromTheQuery, next) {
  // console.log('docsThatReturnedFromTheQuery = ', docsThatReturnedFromTheQuery);

  console.log(`Query took ${Date.now() - this.start} milliseconds.`);

  next();
});

// AGGREGATION MIDDLEWARE :
tourSchema.pre('aggregate', function (next) {
  this.pipeline().unshift({ $match: { secretTour: { $ne: true } } }); // unshift --> to add the beginning of the array .. Shift() --> removes the first element from an array . push --> will add element to end of array.

  console.log(this.pipeline());
  next();
});

const TourModel = mongoose.model('Tour', tourSchema);

module.exports = TourModel;

// testTour
//   .save()
//   .then((doc) => {
//     console.log(doc);
//   })
//   .catch((err) => {
//     console.log('Error saving the doc into the database : ', err);
//   });