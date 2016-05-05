'use strict';
var express = require('express'),
    path = require('path'),
    favicon = require('serve-favicon'),
    logger = require('morgan'),
    cookieParser = require('cookie-parser'),
    bodyParser = require('body-parser'),
    app = express(),
    session = require('express-session'),
    passport = require('passport'),
    // our own custom passport setup happens here
    // passport = require('./models/twitterPassport')(require('passport')),
    User = require('./models/userSchema'),
    config = require('./env/index');
    // server = require('server');


require('./firebase/firebase.js');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));

app.use(bodyParser.json());

app.use(bodyParser.urlencoded({
  extended: false
}));

// allows us to associate a client/user combo with a session
// thus the user does not have to actively login every time
// they wish to access something requiring authentication
app.use(cookieParser());
app.use(session({
  secret: 'zekeisthesingularity'
}));

require('./models/twitterPassport').setup(User, config);
// passport setup---this happens every request
app.use(passport.initialize());
// passport manages its own sessions by piggybacking off of
// the existing req.session that express-session makes
app.use(passport.session());

app.use(express.static(path.join(__dirname, 'public')));
app.use('/', require('./routes/index'));
app.use('/user', require('./routes/user'));

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.send('error: ', err.message);
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500)
  .send('error: ', err.message);
  // res.status(status).send(body);
});

module.exports = app;
