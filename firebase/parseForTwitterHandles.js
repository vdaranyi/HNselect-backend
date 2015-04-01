var Firebase = require('firebase'),
    request = require('request'),
    mongoose = require('mongoose'),
    async = require('async'),
    Promise = require('bluebird'),
    db = require('../models/index');

Promise.promisifyAll(mongoose); // adds 'Async' methods to mongoose that make mongoose promises compatible with bluebird

// Mongoose Schemas
var Item = require('../models/itemSchema');
var User = require('../models/userSchema');

// Parse for twitter handles
function parseForTwitter() {
  Item.find({}).distinct('by', function(err, users){
    console.log(users, users.length);
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
              var about = decodeURI(body.about);
                  userId = body.id;
              console.log(userId, about);
            }
          });
        }
        if (u < 100) {
          u++;
          fetchItem(users[u]);
        }
      }, 0);
    }
  });
}

parseForTwitter();

