require('dotenv').config();

const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const passport = require('passport');

require('./app_api/models/db');
require('./app_api/config/passport');

// ❌ 기존 express-generator 라우터는 안 씀
// const indexRouter = require('./routes/index');
// const usersRouter = require('./routes/users');

// ✅ Loc8r용 라우터만 사용
const indexRouter = require('./app_server/routes/index');
const apiRouter = require('./app_api/routes/index');
// const aboutRouter = require('./app_server/routes/about');
// const usersRouter = require('./app_server/routes/users');

const app = express();

const cors = require('cors');
const corsOptions = {
  origin: '*',
  optionsSuccessStatus: 200 // For legacy browser support
};
app.use(cors(corsOptions));

app.use('/api', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-with, Content-type, Accept, Authorization'
  );
  next();
});

// view engine setup
app.set('views', path.join(__dirname, 'app_server', 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'app_public', 'build', 'browser')));
app.use(passport.initialize());

// CORS 설정
app.use('/api', (req, res, next) => {
  // res.header('Access-Control-Allow-Origin', 'http://localhost:4200');
  res.header('Access-Control-Allow-Origin', '*');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization'
  );
  next();
});

// 서버 사이드 페이지
app.use('/', indexRouter);

// users 라우트는 안 씀
// app.use('/users', usersRouter);

// API
app.use('/api', apiRouter);

app.use((err, req, res, next) => {
  if (err.name === 'UnauthorizedError') {
    res
      .status(401)
      .json({"message" : err.name + ": " + err.message});
  }
});

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
