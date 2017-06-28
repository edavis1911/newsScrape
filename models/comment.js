// Require mongoose
var mongoose = require("mongoose");
// Create a schema class
var Schema = mongoose.Schema;

// Create the Note schema
var CommentSchema = new Schema({
  // Just a string
  body: {
    type: String
  }
});

// Mongoose will automatically save the ObjectIds of the comments
// These ids are referred to in the Article model

// Create the Comment model with the NoteSchema
var Comment = mongoose.model("Comment", CommentSchema);

// Export the Note model
module.exports = Comment;