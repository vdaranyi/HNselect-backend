'use strict';
var router = require('express').Router(),
	async = require('async'),
  User = require('../models/userSchema'),
	Item = require('../models/itemSchema');

router.get('/', function(req, res, next) {
  res.send('Thanks for using Hacker News Select!');
});

module.exports = router;

