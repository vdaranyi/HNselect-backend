var Firebase = require('firebase'),
    request = require('request'),
    mongoose = require('mongoose'),
    async = require('async'),
    Promise = require('bluebird'),
    db = require('../models/index'),
    S = require('string');

Promise.promisifyAll(mongoose); // adds 'Async' methods to mongoose that make mongoose promises compatible with bluebird

// Mongoose Schemas
var Item = require('../models/itemSchema');
var User = require('../models/userSchema');
var twitter = {};

// Parse for twitter handles
function parseForTwitter() {
  Item.find({}).distinct('by', function(err, users){
    var u = 0,
        maxUsers = users.length;
    fetchItem(users[0]);

    function fetchItem(user) {
      setTimeout(function(){
        if (user) {
          var requestUrl = 'https://hacker-news.firebaseio.com/v0/user/' + user + '.json';
          request(requestUrl, function(err, response, body) {
            if (err) console.log('ERROR', err);
            body = JSON.parse(body);
            if ('about' in body) {
              var about = S(body.about).decodeHTMLEntities().s,
                  userId = body.id,
                  temp = [];
              if (about.match(/( |\(|>|^|)@(\w+)/g))
                temp = temp.concat(about.match(/( |\(|>|^)@(\w+)/g));
              if (about.match(/twitter\/(\w+)/g))
                temp = temp.concat(about.match(/twitter\/(\w+)/g));
              if (about.match(/twitter.com\/(\w+)/g))
                temp = temp.concat(about.match(/twitter.com\/(\w+)/g));
              if (temp.length && temp[0]) {
                cleanUpHandle(userId, temp);
              }
            }
          });
        }
        if (u < maxUsers) {
          u++;
          fetchItem(users[u]); 
        }
      }, 0);
    }
  });
}

// Goes throuhgh the array fo potential handles (temp), cleanes handles up, removes duplicates and saves as string
function cleanUpHandle(hnUser, temp) {
  var i = 0;
  while (i < temp.length) {
    temp[i] = temp[i].replace('twitter.com\/','').replace('twitter\/','').replace(' @','').replace('>@','').replace('(@','').replace('@','');
    if (i > 0 && temp[i] === temp[i-1]) {
      temp.shift();
    } else {
      i++;
    }
  }
  if (temp.length) {
    temp = temp.join(', ')
    addTwitterHandleToDB(hnUser, temp);
    console.log(hnUser, '*', temp, '*');
  }
}

function addTwitterHandleToDB(hnUser, twitterHandle) {
  // twitterHandle is string that can include more than one handle
  User.findOne({id: hnUser}).exec(function(err, user){
    if (user) {
      if (twitter.username) {
        user.twitter.username = twitterHandle;
        user.save();
      }
    } else {
      User.create({id: hnUser, twitter: {username: twitterHandle}, loggedin: false});
    }
  });
}

parseForTwitter();


