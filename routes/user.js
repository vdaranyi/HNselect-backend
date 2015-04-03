var router = require('express').Router(),
passport = require('passport')
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
      Item.findOne({}).sort('-id').exec(function(err, lastItem){
        var newsfeedObj = {
          newsfeed: newsfeed,
          lastItem: lastItem.id,
          following: user.following
        };
        res.send(newsfeedObj);
      })
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

router.post('/:user/followuser/:followUser', function(req, res, next){
    var user = req.user,
        followUser = req.params.followUser;
    User.findById(user).exec(function(err, user) {
        if (user.following.indexOf(followUser) === -1) {
          user.following.push(followUser);
          user.save(function(err){
            res.send('User added');
          });
        } else {
          res.send('Already following user');
        }
    });
});

router.delete('/:user/unfollowuser', function(req, res, next){
    var user = req.user,
        unfollowUser = req.body;
    User.findById(user).exec(function(err, user) {
        for (var i=0; i<unfollowUser.length; i++) {
            var followingIndex = user.following.indexOf(unfollowUser[i]);
            if (followingIndex !== -1) {
                user.following.splice(followingIndex, 1);

            }
        }
        user.save(function (err) {
            res.send('User unfollowed');
        });
    });
});

router.post('/:user/bookmark/:storyid', function(req, res, next){
    var user = req.user,
        storyId = req.params.storyid;
    User.findById(user).exec(function(err, user) {
        if (user.bookmarks.indexOf(storyId) === -1) {
          user.bookmarks.push(storyId);
          user.save(function(err){
            res.send('Story added');
          });
        } else {
          res.send('Already bookmarked story');
        }
    });
});

// if the user requests a login through twitter
// execute passport's twitter strategy
router.get('/:hn/twitter/connect', 
  // function(req,res,next) {
  //   // do we need a cookie here, should be doable with req.user
  //   res.cookie('hn',req.params.hn);
  //   // next();
  // },
  passport.authorize('twitter-authz', {failureRedirect: '/account' }));
  
// if twitter sends us an authenticated user
// execute passport's twitter strategy
// afterwards, redirect to root
router.get('/twitter/connected', 
  passport.authorize('twitter-authz', {successRedirect: '/twitterlogin.html',
                                        failureRedirect: '/account' }), 
  // getFollowing()
  function (req, res) {
    var user = req.user;
    var account = req.account;
    console.log(account);
    res.redirect('/twitterlogin.html');
  }
);


/*
function getFollowing(hnUser) {
  var handle = req.query.handle;
  // using our user-specific twitter client
  // get the tweets of the specified handle (should be placed in the query string)
  req.user.client.get('statuses/user_timeline', {
    screen_name: handle
  }, function (err, tweets) {
    if (err) return next(err);
    var leanTweets = tweets.map(function (tweet) {
      // extract relevant info
      return {
        name: tweet.user.name,
        handle: tweet.user.screen_name,
        text: tweet.text,
        date: tweet.created_at,
        imageUrl: tweet.user.profile_image_url
      };
    });
    res.json(leanTweets);
  });
}
*/

module.exports = router;