var Firebase = require('firebase'),
    request = require('request'),
    mongoose = require('mongoose');
    // db = require('../firebase/firebase-data.js');

var Story = require('../models/story-model.js');
var Comment = require('../models/comment-model.js');


// MADE lastItemFetched global, needs to be changed to read from DB
var lastItemFetched = 9196144 // 9200000 // Starting point - 1

var maxItemFb = new Firebase('https://hacker-news.firebaseio.com/v0/maxitem');

var c = console.log.bind(console);

// THIMGS TO CHANGE:
// 1) DO WE STILL NEED TIMEOUT? >>> SOLVED: NO
// 2) HANDLE CASE IF NOT FOUND PARENT IS A COMMENT NOT A STORY >> SOLVED: NOT SAVING COMMENT IF WE DON'T HAVE THE STORY (LEGACY)
// 3) PROPER MOMGOOSE ERROR LOGGING
// 4) REMOVE DB DROPPING
// 5) MOVE ONTO HEROKU
// 6) REMOVE DEBUGGING CODE
// 7) FIREBASE OBJECT IS SOMETIMES EMPTY BUT DOESN'T LOG ERROR
// 8) SOMETIMES ITEM IS NOT AVAILABLE IN THE DATABASE YET UPON EMITTER. SOLVED: SET TIMEOUT BEFORE CALLING ITEM
// 9) TO INCLUDE NOT JUST NEWS AND COMMENTS
// 10) Style: Should subfunction be in or outside of the main function. Currently mainly inside
// 11) Add total count how many stories, comments and other item are processed
// 12) SOLVED: some items are null - edge case
// 13) Comment alogorithm out properly
// 14) Check out dead and deleted items
// 15) Could also run alogorithm by looking up kids and kids of kids - but only works historically, not practical going forward,
//     Alternatively just monitor updates of stories and reflect in DB >> NO need to change now
//     Consider running the simplified analysis life from Chrome extension - as now lighter to handle. Advantage: no backend/server needed
// IMPORTANT: SPLIT INTO WORKER AND CLIENT SERVER!!!
// Heroku: Working memory limit?

// FRONTEND
// If auther is also commenter, don't show
// Change icon
// Confirm visual manipulation

var stories = 0,
    comments = 0,
    others = 0;

// mongoose.connection.on('open', function() {

  // mongoose.connection.db.dropDatabase(function() {
      // c("Dropped old data, now inserting data");
/*
    maxItemFb.on('value', function(snapshot) {
      var countCreatedItems = 0; // just for debugging purposes

      setTimeout(function(){ // NEEDED? Item seems to be not immediately available upon firebase event trigger
        var maxItem = snapshot.val();
        c('MAX ITEM:',maxItem);
        // ITEM CANNOT BE GLOBAL AS WE ARE DOING RECURSIVE CALLS
        var startItemNo = lastItemFetched + 1; // REVERSE CRAWLING ORDER - NO
        c('ITEM:',lastItemFetched);
        // SET NEW LASTITEMFETCHED
        lastItemFetched = maxItem;
        getNewItem(startItemNo);
        function getNewItem(itemNo) {
          // EVERYTHING NEEDS TO BE INSIDE TIMEOUT FUNCTION!
            c('---------------');
            var itemNoShort = itemNo; // .toString().substring(6,8);
            c(itemNoShort,' - 0  getting item...');
            var requestUrl = 'https://hacker-news.firebaseio.com/v0/item/' + itemNo + '.json';
            request(requestUrl, function(err, response, body) {
              var item = JSON.parse(body)
              if (!err && item !== null) { // Some items are null etc.
                  // c('***');
                  // c(item);
                  // c('***');
                if (!item.deleted && !item.dead) {
                  c(itemNoShort,' - 1  got Item');
                  c(itemNoShort,' - 2  is of type: ', item.type)
                  if (item.type === 'story') {
                    stories++; //
                    Story.findOne({id: item.id}, function(err, story){
                      if (story) {
                        for (var key in item) {
                          story[key] = item[key];
                        }
                        c(itemNoShort,' - 3a story updated');
                        story.save(function(err){
                          if (err) console.log(err, ' - could not save update to storyId: ', story.id);
                        });
                      } else {
                        Story.create(item);
                        c(itemNoShort,' - !! 3b story created');
                        c('*** CREATED STORY, ITEM NO *** ', countCreatedItems); // remove after debugging
                        countCreatedItems++; // remove after debugging
                      }
                    });
                  } else if (item.type === 'comment') {
                    comments++;
                    findParentStory(item.parent, item);
                  } else {
                    c('------- Item is neither story nor content');
                    others++;
                  }
                }
              }
            });
            // DUE TO THE RECURSION AND ASYNCRONACITY WE HAVE TO PASS ITEMNO AS AN ARGUMENT TO THE RECURSIVE FUNCTION!
            itemNo++;
            if (itemNo <= maxItem) {
              getNewItem(itemNo);
            }
            c(itemNo, countCreatedItems, comments, others, stories + comments + others);
        }
      }, 1000);


      function findParentStory(parentId, commentToResolve) {
        var itemNoShort = commentToResolve.id; // just for logging
        Story.findOne({id: parentId}, function(err, story) {
          c(itemNoShort,' - 3c looking for comment\'s story');
          if (err || !story) {
            c(itemNoShort,' - 4a comment\'s story not found');
            Comment.findOne({id: parentId}, function(err, comment) {
              if (err || !comment) {
                c('--- NOT SAVING COMMENT --- ', countCreatedItems); // remove after debugging
                countCreatedItems++; // remove after debugging
                // c(itemNoShort,' - 5a comment\'s parent comment not found. Creating parent story with storyId: ', parentId);
                // commenters = [];
                // commenters.push(commentToResolve.by);
                // storyId = parentId;
                // commentToResolve.parentStory = storyId;
                // Story.create({id: storyId, commenters: commenters});
                // createComment(parentId, commentToResolve);
              } else {
                c(itemNoShort,' - 5b comment\'s parent is comment. Next iteration');
                findParentStory(comment.parent, commentToResolve);
              }
            });
          } else {
            c(itemNoShort,' - 4b comment\'s parent story found. Checking whether contributor is already present');
            if (story.commenters.indexOf(commentToResolve.by) === -1) {
              c(itemNoShort,' - 5c commenter not present in story. Adding to story');
              c('Add commmenter to the story:',commentToResolve);
              story.commenters.push(commentToResolve.by);
              story.save(function(err){
                if (err) console.log(err, ' - could not save commenter in story - storyId: ', story.id,' - commentId: ', commentToResolve.id);
              });
            }
            createComment(parentId, commentToResolve);
          }

          // COMMENT CREATION WAS ERENOROUSLY IN THE ELSE STATEMENT INSTEAD OF OUTSIDE > ASYNCHRONICITY!
          // SEPARATE FUNCTION can be removed as only called from one location
          function createComment(parentId, commentToResolve) {
            c('*** CREATED COMMENT, ITEM NO *** ', countCreatedItems); // remove after debugging
            countCreatedItems++; // remove after debugging
            var itemNoShort = commentToResolve.id; // just for logging
            // c(itemNoShort,' - !! 6 Creating comment with parent story');
            commentToResolve.parentStory = parentId;
            Comment.create(commentToResolve);
          }
        });

      // FindParentStory closing brackets
      };

    // Firebase.on closing brackets
    });

// Mongoose closing brackets
//   });
// });

*/
