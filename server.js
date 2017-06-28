// Dependencies
//test comment
var express = require("express");
var bodyParser = require("body-parser");
var logger = require("morgan");
var mongoose = require("mongoose");
var exphbs = require("express-handlebars");

// Requiring our Comment and Article models
var Comment = require("./models/comment.js");
var Article = require("./models/article.js");

// Our scraping tools
var request = require("request");
var cheerio = require("cheerio");

// Mongoose mpromise deprecated - use bluebird promises
var Promise = require("bluebird");

var PORT = process.env.PORT || 3000;

mongoose.Promise = Promise;

// Initialize Express
var app = express();

// Use morgan and body parser with our app
app.use(logger("dev"));
app.use(bodyParser.urlencoded({
  extended: false
}));

//use handlebars and specify default layout to main
app.engine("handlebars", exphbs({
	defaultLayout: "main"
}));
app.set("view engine", "handlebars");

// Make public a static dir
app.use(express.static("public"));

// Database configuration with mongoose
mongoose.connect("mongodb://heroku_723hnvl3:sa9f8pvp9ao44u0ra79kk60lbi@ds139242.mlab.com:39242/heroku_723hnvl3");
var db = mongoose.connection;

// Show any mongoose errors
db.on("error", function(error) {
  console.log("Mongoose Error: ", error);
});

// Once logged in to the db through mongoose, log a success message
db.once("open", function() {
  console.log("Mongoose connection successful.");
});

//Routes

// Scrape data from site and place it into the mongodb db
app.get("/", function(req, res) {
  // grab the body of the html with request
  request("http://www.espn.com/nfl/team/_/name/pit/pittsburgh-steelers", function(error, response, html) {
    //load that into cheerio and save it to $ for a shorthand selector
    var $ = cheerio.load(html);
    // grab elements with the specified class and do the following:
    $(".news-feed_item-meta").each(function(i, element) {

      // Save an empty result object
      var result = {};

      // Adding the text and href of every link, and save them as properties of the result object
      result.title = $(this).text();
      result.link = $(this).closest("a").attr("href");



    Article.count({title: result.title}, function (err, count) {

     	if (count == 0) {

		    var entry = new Article(result);

		    // Now, save that entry to the db
		    entry.save(function(err, doc) {
		        // Log any errors
		      if (err) {
		        console.log(err);
		      }
		        // Or log the doc
		      else {
		        console.log(doc);
		      }
		    });
	  	}
    });

    });
  });
  // redirect to the display articles page
  res.redirect("/articles");
});


// This will get the articles scraped from the mongo db and populate the comments
app.get("/articles", function(req, res) {
  // Grab every doc in the Articles array
  	Article.find({})
	.populate("comment")
    // Now, execute the query
    .exec(function(error, doc) {
      // Send any errors to the browser
      if (error) {
        res.send(error);
      }
    }).then(function(data) {
		//send all objects to handlebars view
		var articleObj = {articles: data};
		console.log(articleObj);
		//render handlebars articles page
		res.render("articles", articleObj);
	});
});

//route to post a comment
app.post("/submit/:id", function(req, res) {
	
  //save comment in a variable
	var newComment = new Comment(req.body);

  //save the new comment the db
  newComment.save(function(error, doc) {
    // Log any errors
    if (error) {
      console.log(error);
    }
    // Otherwise
    else {
      // Use the article id to find and update its comment
      Article.findOneAndUpdate({"_id": req.params.id}, { $push: { "comment": doc._id } }, { new: true }, function(err, newdoc) {
        // Send any errors to the browser
        if (err) {
          res.send(err);
        }
        // otherwise, redirect to articles route, which will populate comments
        else {
          res.redirect("/articles");
        }
      });
    }
  });
});

//route to delete a comment
app.post("/delete/:id", function(req, res) {
  //find comment by id
  Comment.findOneAndRemove({"_id": req.params.id}, function(error, removed) {
    // Send any errors to the browser
    if (error) {
      res.send(error);
    }
    //otherwise, redirect to articles page
    else {
      res.redirect("/articles");
    }
  });
});



// Listen on port 3000
app.listen(PORT, function() {
  console.log("App running on port 3000!");
});