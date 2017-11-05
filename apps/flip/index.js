
'use strict';

var requestapi = require('request');

// environmental variables
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
app.launch(function(request, response) {
	response.say("Who wants to do a flip?").reprompt("Who wants to do a flip?").shouldEndSession(false);
});

// Error handling
app.error = function(exception, request, response) {
	console.log(exception)
	console.log(request);
	console.log(response);	
	response.say( 'The following error has occurred. ' + error.message);
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
	function (request, response) {
		database.collection('alexa-requests').find().toArray(function(err,result) {
			if (err) {
				console.log(err);
			} else {
				console.log(result);
			}
		})
		response.say("I have printed the details in the command line. Who wants to do a flip?").reprompt("Who wants to do a flip?").shouldEndSession(false);
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
  	function (request,response) {
  		database.collection('alexa-requests').save(request, function(err, result) {
	  		if (err) {
	  			console.log("There was an error saving request to MongoDB Atlas");
	  		} else {
	  			console.log("Request saved to MongoDB Atlas");
	  		}
	  	});
	    var name = request.slot('FirstName');
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
	    response.say(name + " wants to do a flip!");
	    response.say("Want to know a secret?").reprompt("Want to know a secret?").shouldEndSession(false);
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
	function(request, alexaSay) {
		// requestapi
		// 	.get('https://alexa-blackjack-gk.herokuapp.com/score')
		// 	.on('response', function(scoreRes) {
		// 		console.log(scoreRes);
		// 		response.say("The score is printed").shouldEndSession(true);
		// 	});
		var contentScore;
		requestapi('https://alexa-blackjack-gk.herokuapp.com/score', function(err, res, body) {
			var content = JSON.parse(body);
			console.log(content.score);
			contentScore = content.score;
			console.log(alexaSay);
			//response.say("the score is 4").shouldEndSession(true);
		})
		process.sleep(1000);
		alexaSay.say("the score is " + contentScore);
		

	}
)

app.intent("SearchIntent",
	{
		"slots":{"SlotName":"AMAZON.Person"},
		"utterances": [
			"Does {SlotName} like to do flips?",
			"Does {SlotName} like flips?"
		]
	},
	function(request, response) {
		var nameQuery = request.slot('SlotName');
		Flip.find({name: nameQuery}, function(err, flip) {
			if (err) {
				console.log(err);
			} else {
				console.log(flip);
				if (flip[0].name) {

					response.say(nameQuery + " likes to do flips.").shouldEndSession(true);
					console.log(nameQuery + " likes to do flips.");
				} else {
					response.say(nameQuery + " does not like to do flips.").shouldEndSession(true);
					console.log(nameQuery + " does not like to do flips.");
				}
			}
		})
	}
)

// Tells secret message
app.intent("SecretIntent",
	{
		"slots":{},
		"utterances": [
			"Tell me a secret",
			"Yes",
			"What",
			"Tell me the secret",
			"I would love to know the secret",
			"Yes please"
		]
	},
	function (request, response) {
		response.say("Gavin loves to do flips!").shouldEndSession(true);
		database.close();
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