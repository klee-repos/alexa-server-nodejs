
'use strict';

// Request promise
var requestPromise = require('request-promise');

// Use global environmental variables
var dotenv = require('dotenv').config();

// Alexa App framework
var alexa = require('alexa-app');
var app = new alexa.app('flip');

// Connection to MongoDB Altas via mongoose
var mongoose = require("mongoose");
var Flip = require("./models/flipSchema");
var uri = process.env.DB_URI;
var database;

mongoose.connect(uri, {useMongoClient: true}, function(err) {
	if (err) {
		console.log("Mongoose error: " + err);
	} else {
		database = mongoose.connection;
		console.log("Successfully connected to MongoDB Atlas via mongoose");
	}
});

// Launch
app.launch(function(alexaReq, alexaRes) {
	alexaRes.say("Who wants to do a flip?").reprompt("Who wants to do a flip?").shouldEndSession(false);
});

// Error handling
app.error = function(exception, alexaReq, alexaRes) {
	console.log(exception)
	console.log(alexaReq);
	console.log(alexaRes);	
	alexaRes.say( 'an error error has occurred.');
};

// Print all stored requests in command line
app.intent("GetRequestsIntent", 
	{
		"slots": {},
		"utterances": [
			"Show request logs",
			"Show me request logs",
			"Request logs"
		]
	},
	function (alexaReq, alexaRes) {
		database.collection('alexa-requests').find().toArray(function(err,result) {
			if (err) {
				console.log(err);
			} else {
				console.log(result);
			}
		})
		alexaRes.say("I have printed the details in the command line. Who wants to do a flip?").reprompt("Who wants to do a flip?").shouldEndSession(false);
	}
)

// Define name of person doing flip
app.intent('FlipIntent',
  	{
    	"slots":{"FirstName":"AMAZON.Person"}
		,"utterances":[ 
			"{FirstName} wants to do a flip",
			"{FirstName}",
			"{FirstName} is gonna do a flip"
		]
  	},
  	function (alexaReq,alexaRes) {
  		database.collection('alexa-requests').save(alexaReq, function(err, result) {
	  		if (err) {
	  			console.log("There was an error saving request to MongoDB Atlas");
	  		} else {
	  			console.log("Request saved to MongoDB Atlas");
	  		}
	  	});
	    var name = alexaReq.slot('FirstName');
	    var myDate = new Date();
	    var newFlip = Flip({
	    	name: name,
	    	created: myDate.getUTCHours()
	    })
	    newFlip.save(function(dbErr) {
	    	if (dbErr) {
	    		console.log(dbErr);
	    	} else {
	    		console.log('Flip recorded to database');
	    	}
	    })
	    alexaRes.say(name + " wants to do a flip!");
	    alexaRes.say("Want to know a secret?").reprompt("Want to know a secret?").shouldEndSession(false);
	}
);

app.intent("GetScoreIntent",
	{
		"slots":{},
		"utterances": [
			"Get score",
			"Tell me the score",
			"What is the score"
		]
	},
	function(alexaReq, alexaRes) {
		return requestPromise('https://alexa-blackjack-gk.herokuapp.com/score')
			.then(function(result) {
				var score = JSON.parse(result)["score"];
				alexaRes.say("Your current score is " + score);
			}).catch(function(err) {
				console.log(err);
			});
	}
)

app.intent("SearchIntent",
	{
		"slots":{"SlotName":"AMAZON.Person"},
		"utterances": [
			"Does {SlotName} like to do flips",
			"Does {SlotName} like flips"
		]
	},
	function(alexaReq, alexaRes) {
		var nameQuery = alexaReq.slot('SlotName');
		var found = false;
		return Flip.find({name: nameQuery}, function(err, flip) {
			if (err) {
				console.log(err);
			} else {
				console.log(flip);
				if (flip.length > 0) {
					found = true;
					console.log(flip[0].name + " likes to do flips.");
				} else {
					found = false;
					console.log(nameQuery + " does not like to do flips.");
				}
			}
		}).then(function(flip) {
			if (found) {
				alexaRes.say(nameQuery + " likes to do flips.");
			} else {
				alexaRes.say(nameQuery + " does not like to do flips.");
			}
		})
	}
)

// Stops skill
app.intent("AMAZON.StopIntent",
	{
		"slots": {},
		"utterances": []
	},
	function(request, response) {
		response.say("Goodbye.").shouldEndSession(true);
		database.close();
	}
)

module.exports = app;