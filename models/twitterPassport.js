// there's already a passport sub-library that'll help us
// do OAuth with twitter
var TwitterStrategy = require('passport-twitter').Strategy;
var passport = require('passport')
// var User = require('./models/model'),
	config = require('../config');
	console.log(config)

exports.setup = function (User) {
	// // when a new user logs in, attach them
	// // to the session
	passport.serializeUser(function (user, done) {
		console.log(arguments, 'ser')
		// but only bother attaching the _id, no the whoe user
		done(null, user._id);
	});
	// each time a request comes in, use the _id from the session
	// data to attach the user to req.user
	passport.deserializeUser(function (id, done) {
		console.log(arguments, 'deserial')
		User.findById(id, done);
	});

	// passport syntax for implementing a strategy
	passport.use('twitter-authz', new TwitterStrategy({
		// we need our app's "username"
		consumerKey: config.twitter.consumerKey,
		// and our app's "password"
		consumerSecret: config.twitter.consumerSecret,
		callbackUrl: config.twitter.callbackUrl,
		passReqToCallback: true
	}, function (req, token, tokenSecret, profile, done) {
		var hnUserId = req.cookies.hn;
		console.log(profile);
		// when the twitter data comes back
		// we'll always call `done` so that passport knows
		// to go on, and what user data to serialize
		console.log(req.cookies.hn);
		User.findOne({id: hnUserId}, function (err, user) {
			if (err) done(err);
			// find an existing user from the database
			else if (user.twitter.id) done(null, user);
			else {
				user.twitter.id = profile.id;
				user.save(function(err){
					done(null, user);
				});
			}
		});
	}));

	return passport;
};