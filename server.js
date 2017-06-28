// Dependencies
var express = require("express");
var bodyParser = require("body-parser");
var mongoose = require("mongoose");

// Requiring Note and Article.js 
var Note = require("./models/Note.js");
var Article = require("./models/Article.js");

// Scrapping requires
var request = require("request");
var cheerio = require("cheerio");

// ES6 Promises
mongoose.Promise = Promise;

// Initialize Express
var app = express();

// Use body parser with the app
app.use(bodyParser.urlencoded({
	extended: false
}));

// Make a public static dir
app.use(express.static("public"));

// Configuring the database with Mongoose
mongoose.connect("mongodb://heroku_723hnvl3:sa9f8pvp9ao44u0ra79kk60lbi@ds139242.mlab.com:39242/heroku_723hnvl3");
var db = mongoose.connection;

// Mongoose Error Handling
db.on("error", function(error) {
	console.log("mongoose Error: ", error);
});

db.once("open", function() {
	console.log("Mongoose connection successful.");
});

// Routes

// Website to scrape
app.get("/scrape", function(req, res) {
	request("http://http://www.espn.com/nfl/team/_/name/pit/pittsburgh-steelers", function(error, response, html) {

		var $ = cheerio.load(html);

		$("article h1").each(function(i, element){

			var result ={};

			result.title = $(this).children("a").text();
			result.link = $(this).children("a").attr("href");

			var entry = new Article(result);
			console.log(entry);

			entry.save(function(err, found) {
				if(err) {
					console.log(err);
				}
				else{
					console.log(found);
				}
			});
		});
	});
	res.send("Scrape Complete");

});


app.get("/articles", function(req, res) {
	Article.find({}, function(error, found) {
		if(err) {
			console.log(err);
		}
		else{
			res.json(found);
		}
	});
});


// Grab an article by it's ObjectId
app.get("/articles/:id", function(req, res) {
  // Using the id passed in the id parameter, prepare a query that finds the matching one in our db...
  Article.findOne({ "_id": req.params.id })
  // ..and populate all of the notes associated with it
  .populate("note")
  // now, execute our query
  .exec(function(error, doc) {
    // Log any errors
    if (error) {
      console.log(error);
    }
    // Otherwise, send the doc to the browser as a json object
    else {
      res.json(doc);
    }
  });
});

// Create a new note or replace an existing note
app.post("/articles/:id", function(req, res) {
  // Create a new note and pass the req.body to the entry
  var newNote = new Note(req.body);

  // And save the new note the db
  newNote.save(function(error, doc) {
    // Log any errors
    if (error) {
      console.log(error);
    }
    // Otherwise
    else {
      // Use the article id to find and update it's note
      Article.findOneAndUpdate({ "_id": req.params.id }, { "note": doc._id })
      // Execute the above query
      .exec(function(err, doc) {
        // Log any errors
        if (err) {
          console.log(err);
        }
        else {
          // Or send the document to the browser
          res.send(doc);
        }
      });
    }
  });
});


// Listen on port 3000
app.listen(process.env.PORT || 3000, function() {
  console.log("App running on port 3000!");
});
