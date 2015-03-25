'use strict';
var router = require('express').Router(),
	async = require('async'),
  User = require('../models/userSchema'),
	Item = require('../models/itemSchema');

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

router.get('/:user/newsfeed', function(req, res, next){
  var username = req.params.user,
      newsfeed;
  User.findOne({id: username}, function(err, user){
    if (!user) {
      // move into different file
      console.log(username, typeof username);
      User.create({id: username, following: ['tptacek','patio11','jacquesm','ColinWright','edw519','fogus','tokenadult','danso','shawndumas','jgrahamc']}, function(err, user){
        console.log('USERNO:',err, user);
        newsfeed = getNewsfeed(user);
        console.log('NEWS:',newsfeed);
      });
    } else {
      console.log('USERYES:',user);
      newsfeed = getNewsfeed(user);
      console.log('NEWS:',newsfeed);
    }
  });
  
  function getNewsfeed(user) {
    Item.find({by: {$in: user.following}}).sort([['id','descending']]).exec(function(err, newsfeed){
      res.send(newsfeed);
    });
  } 

});


router.get('/:user/notifications', function(req, res, next){
  
  Item.find({by: req.params.user}, 'kids', function(err, comments){
    comments. ITERATE
    res.send(comments);
  });
});






module.exports = router;

