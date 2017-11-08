
'use strict';

// Request promise
var requestPromise = require('request-promise');

// Alexa App framework
var alexa = require('alexa-app');
var app = new alexa.app('blackjack');

// Use global environmental variables
var dotenv = require('dotenv').config();

// Connection to MongoDB Altas via mongoose
var mongoose = require("mongoose");
var uri = process.env.DB_URI;
var atlasdb;
var Game = require("./models/game");

mongoose.connect(uri, {useMongoClient: true}, function(err) {
	if (err) {
		console.log("Mongoose error: " + err);
	} else {
		atlasdb = mongoose.connection;
		console.log("Blackjack successfully connected to MongoDB Atlas via mongoose");
	}
});

// Launch
app.launch(function(alexaReq, alexaRes) {
	var amzUserId;
	var newPlayer = true;
	
	if (alexaReq.hasSession()) {
		var session = alexaReq.getSession();
		amzUserId = session.details.userId;
	} else {
		console.log("no session");
	}
	return Game.findOne({amzUserId: amzUserId}, function(err, resGame) {
		if (resGame) {
			newPlayer = false;
			session.set('animalSession', resGame.name);
			console.log("amzUserId found in a game session");
		} else {
			newPlayer = true;
			console.log("amzUserId not found in a game session");
		}
	}).then(function(findRes) {
		if (newPlayer) {
			alexaRes.say("Welcome to Blackjack. What session would you like to connect to?").reprompt("What session would you like to connect to?").shouldEndSession(false);
		} else {
			alexaRes.say("Welcome to Blackjack. Connected successfully").reprompt("Please tell me a command").shouldEndSession(false);
		}
	})
});

// Error handling
app.error = function(err, alexaReq, alexaRes) {
	console.log(err)
	console.log(alexaReq);
	console.log(alexaRes);	
	alexaRes.say( 'an error error has occurred: ' + err);
};

app.intent("ConnectSessionIntent",
	{
		"slots":{"SessionName":"AMAZON.Animal"},
		"utterances": [
			"Connect to {SessionName}",
			"Connect me to {SessionName}",
			"{SessionName}",
			"I would like to connect to {SessionName}"
		]
	},
	function(alexaReq, alexaRes) {
		var animal = alexaReq.slot('SessionName');
		var amzUserId;
		if (alexaReq.hasSession()) {
			var session = alexaReq.getSession();
			amzUserId = session.details.userId;
			session.set('animalSession', animal);
		} else {
			console.log("no session");
		}
		var reqOptions = {
			method: 'POST',
			uri: 'https://express-experiment-kl.herokuapp.com/connect',
			body : {
				name: animal,
				amzUserId: amzUserId
			},
			json: true
		};
		return requestPromise(reqOptions)
			.then(function(jsonRes) {
				if (jsonRes.found) {
					alexaRes
						.say("I have connected you to " + animal)
						.reprompt("Please tell me another command")
						.shouldEndSession(false);
					console.log("successfully connected to session: " + animal);
				} else {
					alexaRes
						.say("Unable to find session. Can you repeat the session name?")
						.reprompt("Can you repeat the session name?")
						.shouldEndSession(false);
				}
			}).catch(function(err) {
				console.log(err);
				alexaRes
					.say("I am having trouble connecting. Can you repeat the session name?")
					.reprompt("Can you repeat the session name?")
					.shouldEndSession(false);
			});
	}
)

app.intent('GetSessionIntent',
	{
		"slots": {},
		"utterances":[
			"What session am I connected to",
			"Connection status",
			"What is my connection status",
			"What animal am I connected to"
		]
	},
	function(alexaReq, alexaRes) {
		var animalSession;
		var amzUserId;
		var sessionName;
		if (alexaReq.hasSession()) {
			var session = alexaReq.getSession();
			amzUserId = session.details.userId;
			animalSession = session.get('animalSession');

		} else {
			console.log("no session");
		}
		if (animalSession) {
			alexaRes.say("You are connected to " + animalSession);
		} else {
			alexaRes.say("You are not connected to an animal session");
		}
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

