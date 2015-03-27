var router = require('express').Router(),
    _ = require('lodash');
    User = require('../models/userSchema'),
    Item = require('../models/itemSchema');

router.param('user', function(req, res, next){
  var username = req.params.user;
  User.findOne({id: username}, function(err, user){
    if (!user) {
      // move standard following into a variable or backend functionality
      User.create({id: username, following: ['tptacek','patio11','jacquesm','ColinWright','edw519','fogus','tokenadult','danso','shawndumas','jgrahamc']}, function(err, user){
        req.user = user;
        next();
      });
    } else {
      req.user = user;
      next();
    }
  });
});

router.get('/:user/newsfeed', function(req, res, next){
  var user = req.user;
    Item.find({by: {$in: user.following}}).sort([['id','descending']]).exec(function(err, newsfeed){
      res.send(newsfeed);
    }); 
});

router.post('/:user/highlight', function(req, res, next){
  var following = req.user.following,
      storyIds = req.body,
      storiesToHighlight = {};
    Item.find({id: {$in: storyIds}}, 'id by commenters -_id').exec(function(err, stories){
      for (var i = 0; i < stories.length; i++) {
        var commentersFollowing = _.intersection(stories[i].commenters,following);
        var authorFollowing = _.intersection([stories[i].by],following);
        if (commentersFollowing.length || authorFollowing.length) {
          storiesToHighlight[stories[i].id] = {
            author: authorFollowing,
            commenters: commentersFollowing
          }; 
        }
      }
      console.log('STORIES:',storiesToHighlight)
      res.send(storiesToHighlight);
    });
});

router.get('/:user/userdata', function(req, res, next){
  var user = req.user;
  res.send(user);
});



module.exports = router;