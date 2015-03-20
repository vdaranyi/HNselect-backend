var Firebase = require('firebase'),
    request = require('request'),
    mongoose = require('mongoose'),
    async = require('async'),
    Promise = require('bluebird');

//For development purposes
require('../models/index');

// Mongoose Schemas
var Item = require('../models/itemSchema');
var User = require('../models/userSchema');

var c = console.log.bind(console);

// MADE lastItemFetched global, needs to be changed to read from DB
var lastItemFetched;

lastItemFetched = 9234000;
// Item.findOne().sort('-id').exec(function (err, maxItemInDB){
//   if (err || !maxItemInDB) {
// 		lastItemFetched = 9233000;
// 	} else {
// 		lastItemFetched = maxItemInDB.id;
// 	}
// }); // Need .then? before calling firebase?

var maxItemFb = new Firebase('https://hacker-news.firebaseio.com/v0/maxitem');



mongoose.connection.on('open', function() {

  mongoose.connection.db.dropDatabase(function() {
      // c("Dropped old data, now inserting data");
/*
    maxItemFb.on('value', function(snapshot) {

      setTimeout(function(){ // NEEDED? Item seems to be not immediately available upon firebase event trigger
        var maxItem = snapshot.val();
        var startItemNo = lastItemFetched + 1; // REVERSE CRAWLING ORDER - NO
        c('* Start item: ',startItemNo, 'max item: ',maxItem);
        lastItemFetched = maxItem;
        getNewItem(startItemNo);

        function getNewItem(itemNo) {
            var requestUrl = 'https://hacker-news.firebaseio.com/v0/item/' + itemNo + '.json';
            request(requestUrl, function(err, response, body) {
              if (err) c('Request Error ', err);
              var item = JSON.parse(body) // Do I need this?
              if (item !== null) { // Some items are null etc.
                if (!item.deleted && !item.dead) {
                  if (item.type === 'story') {
                    var itemToSafe = {
                        by: item.by,
                        id: item.id,
                        time: item.time,
                        type: item.type,
                        storyTitle: item.title,
                        storyUrl: item.url,
                    };
                    // If story has kids, they will be added when we add the respective comment
                    Item.create(item);
                    c(itemNo, ' - Story created');
                  } else if (item.type === 'comment') {
                    c(itemNo, ' - Looking up comment\'s parent');
                    findParentStory(item.parent, item).then(function(item) {

                    })
                  } else {
                  	c(itemNo, ' - Not story nor comment');
                  }
                }
              }
            });
            itemNo++;
            if (itemNo <= maxItem) {
              getNewItem(itemNo);
        	}
        }
      }, 1000);


      function findParentStory_Old(parentId, commentToResolve) {
        return new Promise(function(resolve, reject) {
        Item.findOne({id: parentId}, function(err, parentItem) {
          if (parentItem) {
            if (parentItem.type === 'story') {
              var itemToSafe = {
                  by: commentToResolve.by,
                  id: commentToResolve.id,
                  time: commentToResolve.time,
                  type: commentToResolve.type,
                  storyTitle: parentItem.title,
                  storyUrl: parentItem.url,
                  storyId: parentItem.title,
                  storyBy: parentItem.by,
                  parent: commentToResolve.parent,
                  kids: commentToResolve.kids,
                  text: commentToResolve.text
              };
            } else if (parentItem.parent) {
              findParentStory(parentItem.parent, commentToResolve);
            }
          } else {
            // comments schema maps the one provided by Firebase
            c('Comment without parent:', commentToResolve.id);
            var itemToSafe = commentToResolve;
            if (itemToSafe.kids) {
              addChildrenAuthors(itemToSafe);
            } else {
              Item.create(itemToSafe, function(item) {
                resolve(item);
              }
            }
          }
        });

        })

      }
*/

      function fetchItem(itemNo) {
        return new Promise(function(resolve, reject) {
          var requestUrl = 'https://hacker-news.firebaseio.com/v0/item/' + itemNo + '.json';
          request(requestUrl, function(err, response, body) {
            if (err) c('Request Error ', err);
            var item = JSON.parse(body) // Do I need this?
            if (item !== null) { // Some items are null etc.
              if (!item.deleted && !item.dead) {
                if (item.type === 'story') {
                  var itemToSafe = {
                      by: item.by,
                      id: item.id,
                      time: item.time,
                      type: item.type,
                      storyTitle: item.title,
                      storyUrl: item.url,
                  };
                  console.log("ITEM", item, "SCHEMA", Item.schema);
                  // If story has kids, they will be added when we add the respective comment
                  Item.create(item, function(err, item) {
                    c(itemNo, ' - Story created', item);
                    resolve(item);
                  });
                } else if (item.type === 'comment') {
                  Item.create(item, function(err, item) {
                    findParentStory(item.parent, item).then(function(item) {
                      c(itemNo, ' - Comment created');
                      resolve(item);
                    });
                  });
                } else {
                  c(itemNo, ' - Not story nor comment');
                  reject("Not a story or comment");
                }
              }
            }
          });
        });
      }

      function findOrFetchItem(itemNo) {
        return new Promise(function(resolve, reject) {
          Item.findOne({id: itemNo}, function(err, item) {
            if(!item) {
              c("Didn't find item", item);
              resolve(fetchItem(itemNo));
            } else {
              c("Did find item", item);
              resolve(item);
            }
          });
        });
      }

// c('start');
// findOrFetchItem(9214017).then(function(item){
//   console.log(item);
// });


      function findParentStory(parentId, origComment) {
        return new Promise(function(resolve, reject) {
          findOrFetchItem(parentId).then(function(parent) {
            if(parent.type === "story") {
              c("found a parent story", parent);
              origComment.title = parent.title;

              origComment.save();
              parent.commenters.push(origComment.by);
              parent.save(function(err) {
                resolve(origComment);              
              })
            } else {
              c("found a parent comment, recursing");
              // parent is comment
              return findParentStory(parent.parent, origComment);                            
            }
          })
        })
      }

      function addChildrenAuthors(itemToSafe){
        kidsArray = itemToSafe.kids;
        c('addChildenAuthors hit', kidsArray);
        Item.find()
        .where('id')
        .in(kidsArray)
        .select('by')
        .exec(function(err, kidsAuthors){
          if (err) c('ERROR',err);
          c('kidsAuthors',kidsAuthors);
          itemToSafe.commenters = kidsAuthors;
          Item.create(itemToSafe);
          c(itemToSafe.id, ' - Comment created with commenters ', kidsAuthors);
        });
      };


    // Firebase.on closing brackets
    // });

// Mongoose closing brackets
  });
});