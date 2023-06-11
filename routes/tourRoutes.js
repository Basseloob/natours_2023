const express = require('express');
const tourController = require('../controllers/tourController');
const router = express.Router();
const authController = require('../controllers/authController');

// Every time we call tours/:id ist gonna log that id in console.//
// router.param('id', tourController.checkId);

router
  .route('/top-5-cheap')
  .get(tourController.aliasTopTours, tourController.getAllTours);

router.route('/tour-stats').get(tourController.getTourStats);
router.route('/monthly-plan/:year').get(tourController.getMonthlyPlan);

// if USER not authenticated it will not get the getALlTours :
router.route('/').get(authController.protect, tourController.getAllTours).post(
  // tourController.checkBody,
  tourController.createTour
);
router
  .route('/:id')
  .get(tourController.getTour)
  .patch(tourController.updateTour)
  .delete(
    authController.protect,
    // Only allowed users that can delete.
    authController.restrictTo('admin', 'lead-guide'),
    tourController.deleteTour
  );

module.exports = router;

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// const express = require('express');// const tourController = require('../controllers/tourController');
// const router = express.Router();
// // Every time we call tours/:id ist gonna log that id in console.// router.param('id', tourController.checkId);
// router//   .route('/')//   .get(tourController.getAllTours)//   .post(tourController.checkBody, tourController.createTour);// router//   .route('/:id')//   .get(tourController.getTour)//   .patch(tourController.updateTour)//   .delete(tourController.deleteTour);
// module.exports = router;
