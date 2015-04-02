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

    function fetchItem(user, i) {
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
              if (temp.length && temp[0] !== null) {
                if (temp.length === 1) {
                  // Finish RegEx
                  // temp.replace(/[twitter.com\/|twitter\/|@| @|>@|(@]/,'');
                  twitter[user] = temp[0];
                } else {
                  twitter[user] = temp;
                }
                // User.find({id: user}).exec(function(err,userObj){

                // });
              }
              // console.log(userId, ' // ', temp ,' // ', about);
              if (i === maxUsers - 1) console.log('DONE: ',twitter);
            }
          });
        }
        if (u < maxUsers) {
          u++;
          fetchItem(users[u], u); 
        }
      }, 0);
    }
  });
}

parseForTwitter();


