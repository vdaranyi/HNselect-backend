'use strict';
var router = require('express').Router(),
	async = require('async'),
  User = require('../models/userSchema'),
	Item = require('../models/itemSchema');

router.get('/', function(req, res, next) {
  res.render('../public/index.html');
});

module.exports = router;

