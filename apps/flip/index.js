
'use strict';

// environmental variables
var dotenv = require('dotenv').config();

// Alexa App framework
var alexa = require('alexa-app');
var app = new alexa.app('flip');

// Connection to MongoDB Atlas
var MongoClient = require("mongodb").MongoClient;
var uri = process.env.DB_URI;
var database;

MongoClient.connect(uri, function(err, db) {
	if (err) {
		console.log("MongoDB error: " + err);
	} else {
		database = db;
		console.log("Successfully connected to MongoDB Atlas");
	}
})

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
    response.say(name + " wants to do a flip!");
    response.say("Want to know a secret?").reprompt("Want to know a secret?").shouldEndSession(false);
  }
);

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