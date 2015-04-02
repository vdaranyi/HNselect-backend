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

// Parse for twitter handles
function parseForTwitter() {
  Item.find({}).distinct('by', function(err, users){
    var u = 100,
        maxUsers = users.length,
        twitter = {};
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

                  /*
                  twitter: @
                  twitter.com/
                  Twitter : @
                  twitter @
                  twitter at @
                  @.... on Twitter
                  Twitter:  @
                  \s @...
                  @...)
                  @...\s
                  @...<p>
                  @...[end]
                */
                // to be finished
              if (about.match(/( |\(|>|^)@(\w+)/g))
                temp.push(about.match(/( |\(|>|^)@(\w+)/g));
              if (about.match(/twitter\/(\w+)/g))
                temp.push(about.match(/twitter\/(\w+)/g));
              if (about.match(/twitter.com\/(\w+)/g)) 
                temp.push(about.match(/twitter.com\/(\w+)/g));
              if (temp) 
                twitter.userId = temp;
              // var twitter = about.substr(about.indexOf('twitter')-5,20),
              //     atSign = about.substr(about.indexOf('@')-5,20),
              // console.log(userId, ' * ',twitter, ' * ', atSign, ' * ', at);
              console.log(userId, ' // ', temp ,' // ', about);
            }
          });
        }
        if (u < 1000) {
          u++;
          fetchItem(users[u]);
        }
      }, 0);
    }
  });
}

parseForTwitter();

