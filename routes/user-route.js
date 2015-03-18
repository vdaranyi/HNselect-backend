'use strict';
var router = require('express').Router(),
  User = require('../models/user-model.js'),
  Story = require('../models/story-model.js');


// if user does not exist, creates new user based on their Hacker News username
// else gets the array of who the user is following
router.get('/:name', function(req, res, next) {
  User.findOne({
    hnUsername: req.params.name
  }, function(err, user) {
    if (err) return next(err);
    else if (user) res.json(user.following);
    else {
      User.create({
        hnUsername: req.params.name,
        following: []
      }, function(err, user) {
        if (err) return next(err);
        else res.json(user.following);
      });
    }
  });
});

// updates array of who the user is following
router.put('/:name', function(req, res, next) {
  console.log('req.body.differentUser: ', req.body.differentUser);
  User.findOne({
    hnUsername: req.params.name
  }, function(err, user) {
    if (err) return next(err);
    else {
      var index = user.following.indexOf(req.body.differentUser);
      if (index > -1) {
          user.following.splice(index, 1);
        } else {
          user.following.push(req.body.differentUser);
        }
      user.save();
      res.json(user.following);
    }
  });
});

module.exports = router;
