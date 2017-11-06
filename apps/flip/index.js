
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
var atlasdb;

mongoose.connect(uri, {useMongoClient: true}, function(err) {
	if (err) {
		console.log("Mongoose error: " + err);
	} else {
		atlasdb = mongoose.connection;
		console.log("Successfully connected to MongoDB Atlas via mongoose");
	}
});

// Launch
app.launch(function(alexaReq, alexaRes) {
	alexaRes.say("Welcome to flip. Please tell me a command.").reprompt("Please tell me a command.").shouldEndSession(false);
});

// Error handling
app.error = function(exception, alexaReq, alexaRes) {
	console.log(exception)
	console.log(alexaReq);
	console.log(alexaRes);	
	alexaRes.say( 'an error error has occurred.');
};

// Define name of person doing flip
app.intent('FlipIntent',
  	{
    	"slots":{"FirstName":"AMAZON.US_FIRST_NAME"}
		,"utterances":[ 
			"{FirstName} wants to do a flip",
			"{FirstName}",
			"{FirstName} is gonna do a flip"
		]
  	},
  	function (alexaReq,alexaRes) {
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
	    		console.log('Name recorded to atlasdb');
	    	}
	    })
	    alexaRes.say(name + " wants to do a flip!");
	    alexaRes.say("Please tell me a another command.").reprompt("Please tell me a another command.").shouldEndSession(false);
	}
);


// Get score from web service
app.intent("GetScoreIntent",
	{
		"slots":{"SessionName":"AMAZON.Animal"},
		"utterances": [
			"What is the score of {SessionName}",
			"Tell me the score of {SessionName}",
			"What is the score of {SessionName}"
		]
	},
	function(alexaReq, alexaRes) {
		var animal = alexaReq.slot('SessionName');
		return requestPromise('https://c09ca493.ngrok.io/score/' + animal)
			.then(function(result) {
				var score = JSON.parse(result)["score"];
				alexaRes.say("Your current score is " + score);
			}).catch(function(err) {
				console.log(err);
			});
	}
)

// Get score from web service
app.intent("SetScoreIntent",
	{
		"slots":{"SessionName":"AMAZON.Animal", "ScoreNumber":"AMAZON.Number"},
		"utterances": [
			"Set score of {SessionName} to {ScoreNumber}",
			"Make {SessionName} {ScoreNumber}"
		]
	},
	function(alexaReq, alexaRes) {
		var animal = alexaReq.slot('SessionName');
		var score = alexaReq.slot('ScoreNumber');

		var reqOptions = {
			method: 'POST',
			uri: 'https://c09ca493.ngrok.io/score/',
			body : {
				name: animal,
				score: score
			},
			json: true
		};

		return requestPromise(reqOptions).then(function(bodyRes) {
			alexaRes.say("The score of " + animal + " has been updated");
		}).catch(function(err) {
			console.log(err);
		})
	}
)

// Search db to see if person likes to do flips
app.intent("SearchIntent",
	{
		"slots":{"SlotName":"AMAZON.US_FIRST_NAME"},
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
		}).then(function(result) {
			if (found) {
				alexaRes.say(nameQuery + " likes to do flips.").shouldEndSession(true);
			} else {
				alexaRes.say(nameQuery + " does not like to do flips.").shouldEndSession(true);
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
	}
)

module.exports = app;