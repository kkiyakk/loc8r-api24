require('dotenv').config();
const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const passport = require('passport');

// 모델, DB, 패스포트 설정
require('./app_api/models/db');
require('./app_api/config/passport');

const usersRouter = require('./app_server/routes/users');
const apiRouter = require('./app_api/routes/index');

const app = express();

// CORS 설정
const cors = require('cors');
const corsOptions = {
  origin: '*',
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  next();
});

// view engine
app.set('views', path.join(__dirname, 'app_server', 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'app_public', 'build')));
app.use(passport.initialize());

// 라우팅
app.use('/users', usersRouter);
app.use('/api', apiRouter);

// SPA fallback (React 라우팅용)
app.get('*', function(req, res) {
  res.sendFile(path.join(__dirname, 'app_public', 'build', 'index.html'));
});

// catch 404
app.use(function(req, res, next) {
  next(createError(404));
});

// JWT Unauthorized 처리
app.use((err, req, res, next) => {
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({ message: err.name + ": " + err.message });
  }
  next(err);
});

// 일반 에러 처리
app.use(function(err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  res.status(err.status || 500);
  res.render('error');
});

// Render용 포트
const port = process.env.PORT || 500;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

module.exports = app;
