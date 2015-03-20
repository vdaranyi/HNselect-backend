'use strict';
var mongoose = require('mongoose');

var itemSchema = new mongoose.Schema({
  // Not saving all fields
  by: {type: String, index: true}, // author
  id: {type: Number, index: true}, // item no
  time: Number, // unix timestamp
  type: String, // comment or story
  storytitle: String, // title of story or title of story that comment relates to
  storyurl: String, // url of... dito
  storyid: {type: Number, index: true}, // id of... dito (null if type is story)
  storyby: String, // if comment, byId of creator of story 
  parent: Number, // direct parent
  kids: [Number], // direct kids
  text: String, // text of comment (null if type is story)
  commenters: [String] // username (by) of all commenters
});

module.exports = mongoose.model('Item', itemSchema);
