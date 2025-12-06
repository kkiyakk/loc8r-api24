require('dotenv').config();
const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const passport = require('passport');

// DB, 모델, 패스포트 설정
require('./app_api/models/db');
require('./app_api/config/passport');

// 라우터
const usersRouter = require('./app_server/routes/users');
const apiRouter = require('./app_api/routes/index');

const app = express();

// ====== CORS 설정 ======
const cors = require('cors');
const corsOptions = {
  origin: '*', // Render에서는 기본 '*' 가능
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

// ====== view engine 설정 ======
app.set('views', path.join(__dirname, 'app_server', 'views'));
app.set('view engine', 'pug');

// ====== 기본 미들웨어 ======
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// ====== 정적 파일 ======
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'app_public', 'build')));

app.use(passport.initialize());

// ====== API 라우팅 ======
app.use('/users', usersRouter);
app.use('/api', apiRouter);

// ====== React SPA fallback ======
app.get('*', function(req, res) {
  res.sendFile(path.join(__dirname, 'app_public', 'build', 'index.html'));
});

// ====== 404 catch ======
app.use(function(req, res, next) {
  next(createError(404));
});

// ====== JWT Unauthorized 처리 ======
app.use((err, req, res, next) => {
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({ message: err.name + ": " + err.message });
  }
  next(err);
});

// ====== 일반 에러 처리 ======
app.use(function(err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  res.status(err.status || 500);
  res.render('error');
});

// ====== Render용 포트 ======
const port = process.env.PORT || 5000; // Render에서 자동 할당
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

module.exports = app;
