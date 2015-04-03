'use strict';
var mongoose = require('mongoose');

var itemSchema = new mongoose.Schema({
  // Not saving all fields
  createdAt: { type: Date, expires: '30d', default: Date.now}, // Data expires after 3 days
  by: {type: String, index: true}, // author
  id: {type: Number, index: true, unique: true}, // item no
  time: Number, // unix timestamp
  type: String, // comment or story
  storytitle: String, // title of story or title of story that comment relates to
  storyurl: String, // url of... dito
  storyid: {type: Number, index: true}, // id of... dito (null if type is story)
  storyby: String, // if comment, byId of creator of story 
  parent: Number, // direct parent
  kids: [Number], // direct kids
  text: String, // text of comment, description of story if retrieved through open-graph
  commenters: [String] // username (by) of all commenters
});

module.exports = mongoose.model('Item', itemSchema);
