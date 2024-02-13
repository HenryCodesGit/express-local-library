require('dotenv').config(); 

const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');

const app = express();

// Safety and efficiency stuff?

// Add compression to reduce http response size
const compression = require("compression");
app.use(compression())

// Add helmet to the middleware chain, and set CSP headers to allow our Bootstrap and Jquery to be served
const helmet = require("helmet");
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      "script-src": ["'self'", "code.jquery.com", "cdn.jsdelivr.net"], //This code appears to only allow scrips from the listed lin ks
    },
  }),
);

//Rate limiter to prevent too many calls to API
const RateLimit = require("express-rate-limit");
const limiter = RateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 20,
});
app.use(limiter); // Apply rate limiter to all requests

// Setting up the mongoose database connection
// Currently all it does is connect and do nothing else
const mongoose = require('mongoose');
mongoose.set('strictQuery', false); //Strict query neeed for some reason.. see MDN article
const mongoDB = process.env.MONGODB_URI;

main().catch((err) => { console.log(err) });
async function main(){ await mongoose.connect(mongoDB); }

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

//Routes for the app
app.use('/', require('./routes/index'));
app.use('/users', require('./routes/users'));
app.use('/catalog', require('./routes/catalog'));

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
