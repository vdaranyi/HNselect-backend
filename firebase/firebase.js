var Firebase = require('firebase'),
    request = require('request'),
    mongoose = require('mongoose'),
    async = require('async'),
    Promise = require('bluebird');
    db = require('../models/index');

// Mongoose Schemas
var Item = require('../models/itemSchema');
var User = require('../models/userSchema');

var c = console.log.bind(console);

// MADE lastItemFetched global, needs to be changed to read from DB
var lastItemFetched;

Item.findOne().sort('-id').exec(function (err, maxItemInDB){
  if (err || !maxItemInDB) {
		lastItemFetched = 9241070;
	} else {
		lastItemFetched = maxItemInDB.id;
	}
}); // Need .then? before calling firebase?

var maxItemFb = new Firebase('https://hacker-news.firebaseio.com/v0/maxitem');

// SOME ITEMS THAT WERE JUST CREATED RETURN NULL, TIMING ISSUE?
// ORDER: Check for the latest item in DB, if exists, set to lastItem, call maxitem on Firebase and start fetching items,
// If DB is empty, wait for start fetching, for example, the last 1,000 items
// Just call fetch upon firebase emit, as the new item is obviously not yet in the db.
// DB doesn't get dropped upon startup.
// Do I need all commenters of a story? Currently only adding the commenters that are parsed, when looking for parent story >> solution: include addChildrenAuthors function?
// Don't need to wait for .then to run before getting the next item. Can be done concurrent? Line 49
// why do I do parent.save() but not origComment.save()?
// complete error handling
// why does it delete the data but not reset lastItemFetched?
// Should I add all the kids to story or just the one i added? Currently no kids are added to story.
// Error: Unhandled rejection Error: [object Object] line 106. Do we need a .catch for every .then?
// Need to properly handle deleted, dead and null items
// We cannot make concurrent item calls because then there might be overlapping item creation > How to optimize speed?
// Correctly reject deleted: true items!!

mongoose.connection.on('open', function() {

  mongoose.connection.db.dropDatabase(function() {
      c("Dropped old data, now inserting data");

    maxItemFb.on('value', function(snapshot) {

      setTimeout(function(){ // NEEDED? Item seems to be not immediately available upon firebase event trigger
        var maxItem = snapshot.val();
        var currentItemNo = lastItemFetched + 1; 
        c('* Start item: ',currentItemNo, 'max item: ',maxItem);
        lastItemFetched = maxItem;
        
        iterateOverItems();

        function iterateOverItems() {
          findOrFetchItem(currentItemNo)
          .then(function(item){
            c('DONE ', item.id);
            currentItemNo++;
            if (currentItemNo <= maxItem) {
              iterateOverItems();
            }
          })
          .catch(function(err){
            c(err);
          });
        }

      }, 1000);


      function fetchItem(itemNo) {
        return new Promise(function(resolve, reject) {
          var requestUrl = 'https://hacker-news.firebaseio.com/v0/item/' + itemNo + '.json';
          request(requestUrl, function(err, response, body) {
            if (err) reject({itemNo: itemNo, errorType: 'Firebase request error', error: err});
            var item = JSON.parse(body) // Do I need this?
            if (item !== null) { // Some items are null etc.
              if (!item.deleted && !item.dead ) {
                if (item.type === 'story') {
                  var itemToSafe = {
                      by: item.by,
                      id: item.id,
                      time: item.time,
                      type: item.type,
                      storytitle: item.title,
                      storyurl: item.url,
                      kids: item.kids
                  };
                  // If story has kids, they will be added when we add the respective comment
                  Item.create(itemToSafe, function(err, item) {
                    c(itemNo, ' - Story created', item);
                    resolve(item);
                  });
                } else if (item.type === 'comment') {
                  Item.create(item, function(err, item) {
                    if (err) reject({itemNo: itemNo, errorType: 'Could not create item in DB', error: err})
                    findParentStory(item.parent, item).then(function(item) {
                      c(itemNo, ' - Comment created');
                      resolve(item);
                    });
                  });
                } else {
                  reject({itemNo: itemNo, errorType: 'Firebased: not story nor comment item'});
                }
              } else {
                reject({itemNo: itemNo, errorType: 'Firebase: deleted or dead item'});
              }
            } else {
              reject({itemNo: itemNo, errorType: 'Firebase: null item'});
            }
          });
        });
      }

      // DOES THIS FCT REALLY TO RETURN A PROMISE?
      function findOrFetchItem(itemNo) {
        return new Promise(function(resolve, reject) {
          Item.findOne({id: itemNo}, function(err, item) {
            if (err) reject({itemNo: itemNo, errorType: 'DB lookup error', error: err});
            if(!item) {
              c("Didn't find item in DB", itemNo);
              // resolve(fetchItem(itemNo)); // resolve here???
              fetchItem(itemNo).then(function(item){
                resolve(item);
              });
            } else {
              c("Did find item in DB", itemNo);
              resolve(item);
            }
          });
        });
      }



      function findParentStory(parentId, origComment) {
        return new Promise(function(resolve, reject) {
          findOrFetchItem(parentId).then(function(parent) {
            if(parent.type === "story") {
              c("found a parent story");
              origComment.storytitle = parent.storytitle;
              origComment.storyurl = parent.storyurl;
              origComment.storyid = parent.id;
              origComment.storyby = parent.by;
              origComment.save();
              // Add commenters to parent, if not already part of array
              if (parent.commenters.indexOf(origComment.by) === -1) {                
                parent.commenters.push(origComment.by);
              }
              parent.save(function(err) {
                resolve(origComment);              
              })
            } else {
              // parent is comment
              c("found a parent comment, recursing");
              if (parent.commenters.indexOf(origComment.by) === -1) {                
                parent.commenters.push(origComment.by);
              }
              parent.save(function(err) {            
                // resolve(findParentStory(parent.parent, origComment));
                findParentStory(parent.parent, origComment).then(function(item){
                  resolve(item);
                }); 
              })
            }
          })
        })
      }

      // Currently not used, functionality also needs to be confirmed
      /* 
      function addChildrenAuthors(itemToSafe){
        kidsArray = itemToSafe.kids;
        c('addChildrenAuthors hit', kidsArray);
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
      */

    // Firebase.on closing brackets
    });

// Mongoose closing brackets
  });
});