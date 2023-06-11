// Start the express app :
const express = require('express');
const app = express();
const fs = require('fs');
const morgan = require('morgan');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');

const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');

///////////////////////////////////////////////////////////////////////////////////////////
// 1) Middle Ware :

app.use(morgan('dev')); // GET /api/v1/tours 200 4.369 ms - 8751

if (process.env.NODE_ENV === 'development') {
  console.log('we are in the DEVELOPMENT env');
}
//  else {
//   console.log('we are in the PRODUCTION env');
// }

app.use(express.json());
app.use(express.static(`${__dirname}/public`)); // serving static files --> http://localhost:3000/overview.html

// app.use((req, res, next) => {
//   console.log('Hello from the Global MiddleWare...');
//   next();
// });

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  console.log('Hello Time of request MiddleWare ', req.requestTime);
  console.log('req.headers = ', req.headers); // access to http headers with express :
  next();
});

///////////////////////////////////////////////////////////////////////////////////////////
// 2) Route Handlers:

///////////////////////////////////////////////////////////////////////////////////////////
// 3) Routes :

// app.get('/api/v1/tours', getAllTours);
// app.get('/api/v1/tours/:id', getTour);
// app.post('/api/v1/tours', createTour);
// app.patch('/api/v1/tours/:id', updateTour);
// app.delete('/api/v1/tours/:id', deleteTour);
// app.route('/api/v1/tours').get(getAllTours).post(createTour);
// app
//   .route('/api/v1/tours/:id')
//   .get(getTour)
//   .patch(updateTour)
//   .delete(deleteTour);

app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);

// Error route handler :

app.all('*', (req, res, next) => {
  // // all for get,post,delete..
  // res.status(404).json({
  //   status: 'fail',
  //   message: `Cant find ${req.originalUrl} on this server`,
  // });

  // // Creating an error :
  // const err = new Error(`Cant find ${req.originalUrl} on this server!`);
  // err.status = 'fail';
  // err.statusCode = 404;

  // next(err); // Passing the err inside the next --> will skip all the middleware and move directly to the error.

  next(
    new AppError(`Heeeeey Cant find ${req.originalUrl} on this server!`, 404)
  );
});

// Global Error route handler :

// app.use((err, req, res, next) => {
//   // 4 argumnet means it an error handler.

//   console.error(err.stack); // shows where the error occurred.
//   err.statusCode = err.statusCode || 500;
//   err.status = err.status || 'error';

//   res.status(err.statusCode).json({
//     status: err.status,
//     message: err.message,
//   });
// });

app.use(globalErrorHandler);

///////////////////////////////////////////////////////////////////////////////////////////
//Server.js

module.exports = app;

///////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////

// const express = require('express'),
//   app = express();
// const fs = require('fs');
// const morgan = require('morgan');

// const tourRouter = require('./routes/tourRoutes');
// const userRouter = require('./routes/userRoutes');

// ///////////////////////////////////////////////////////////////////////////////////////////
// // 1) Middle Ware :

// app.use(morgan('dev')); // GET /api/v1/tours 200 4.369 ms - 8751

// if (process.env.NODE_ENV === 'development') {
//   console.log('we are in the DEVELOPMENT env');
// } else {
//   console.log('we are in the PRODUCTION env');
// }

// app.use(express.json());
// app.use(express.static(`${__dirname}/public`)); // serving static files --> http://localhost:3000/overview.html

// // app.use((req, res, next) => {
// //   console.log('Hello from the Global MiddleWare...');
// //   next();
// // });
// app.use((req, res, next) => {
//   req.requestTime = new Date().toISOString();
//   console.log('Time of request MiddleWare ', req.requestTime);
//   next();
// });

// ///////////////////////////////////////////////////////////////////////////////////////////
// // 2) Route Handlers:

// ///////////////////////////////////////////////////////////////////////////////////////////
// // 3) Routes :

// // app.get('/api/v1/tours', getAllTours);
// // app.get('/api/v1/tours/:id', getTour);
// // app.post('/api/v1/tours', createTour);
// // app.patch('/api/v1/tours/:id', updateTour);
// // app.delete('/api/v1/tours/:id', deleteTour);
// // app.route('/api/v1/tours').get(getAllTours).post(createTour);
// // app
// //   .route('/api/v1/tours/:id')
// //   .get(getTour)
// //   .patch(updateTour)
// //   .delete(deleteTour);

// app.use('/api/v1/tours', tourRouter);
// app.use('/api/v1/users', userRouter);

// ///////////////////////////////////////////////////////////////////////////////////////////
// //Server.js

// module.exports = app;

// // 3 server
// const dotenv = require('dotenv');
// dotenv.config({ path: './config.env' });

// const app = require('./app');

// // Showing the enviroment we are on.
// // console.log(app.get('env'));
// // console.log(process.env);

// const port = process.env.PORT || 3000;
// app.listen(port, () => {
//   console.log(`App is running on port ${port}...`);
// });
