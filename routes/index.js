'use strict';
var router = require('express').Router(),
	async = require('async'),
  User = require('../models/user-model'),
	Story = require('../models/story-model');

router.get('/', function(req, res, next) {
  res.send('Thanks for using Hacker News Select!');
});

// Get and respond with commenters data
router.post('/getCommenters', function(req, res, next) {
  var storyIdsOnPage = req.body.storyIdsOnPage,
      user = req.body.user,
      commenters = {};
  // IMPLEMENT DB LOOKUP user specific
  async.each(storyIdsOnPage, function(storyId, cb){
    Story.findOne({id: storyId}, function(err, story){
      User.findOne({hnUsername: user}, function(err, user) {
        story.commenters = story.commenters.filter(function(commenter) {
          return user.following.indexOf(commenter) !== -1;
        });
        commenters[storyId] = story.commenters;
        cb();
      });
    });
  }, function(err) {
    console.log(commenters);
    if (err) console.log(err);
    else res.send(commenters);
  });
});

module.exports = router;

