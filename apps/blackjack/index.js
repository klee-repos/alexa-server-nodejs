
'use strict';

// Request promise
var requestPromise = require('request-promise');

// Alexa App framework
var alexa = require('alexa-app');
var app = new alexa.app('blackjack');

// Use global environmental variables
var dotenv = require('dotenv').config();

// Configuration variables
var client_uri = process.env.CLIENT_URI || "http://localhost:3000/";
var db_uri = process.env.DB_URI;

// Connection to MongoDB Altas via mongoose
var mongoose = require("mongoose");
var atlasdb;
var Session = require("./models/Session");

mongoose.connect(db_uri, {useMongoClient: true}, function(err) {
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
	var animalSession;
	
	if (alexaReq.hasSession()) {
		var session = alexaReq.getSession();
		amzUserId = session.details.userId;
	} else {
		console.log("no session");
	}
	return Session.findOne({amzUserId: amzUserId}, function(err, resSession) {
		if (resSession) {
			newPlayer = false;
			animalSession = resSession.name;
			session.set('animalSession', resSession.name);
			console.log("amzUserId found in a Session session");
		} else {
			newPlayer = true;
			console.log("amzUserId not found in a Session session");
		}
	}).then(function(findRes) {
		if (newPlayer) {
			alexaRes.say("Welcome to Blackjack. What session would you like to connect to?").reprompt("What session would you like to connect to?").shouldEndSession(false);
		} else {
			alexaRes.say("Welcome to Blackjack. Connected successfully to session " + animalSession).reprompt("Please tell me a command").shouldEndSession(false);
		}
	})
});


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
			uri: client_uri + 'connect',
			body : {
				sessionCode: animal,
				amzUserId: amzUserId
			},
			json: true
		};
		return requestPromise(reqOptions)
			.then(function(jsonRes) {
				if (jsonRes.found) {
					alexaRes
						.say("I have connected you to " + animal)
						.reprompt("Ready to play blackjack")
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
			"What animal am I connected to",
			"Session status",
			"What is my session"
		]
	},
	function(alexaReq, alexaRes) {
		var animalSession;
		var amzUserId;
		if (alexaReq.hasSession()) {
			var session = alexaReq.getSession();
			amzUserId = session.details.userId;
			animalSession = session.get('animalSession');

		} else {
			console.log("no session");
		}
		if (animalSession) {
			alexaRes
				.say("You are connected to " + animalSession)
				.reprompt("Ready to play blackjack.")
				.shouldEndSession(false);
		} else {
			alexaRes
				.say("You are not connected to an animal session. What session would you like to connect to?")
				.reprompt("What session would you like to connect to?")
				.shouldEndSession(false);
		}
	}
)

app.intent('DealIntent',
	{
		"slots": {},
		"utterances": [
			"Deal",
			"Deal cards",
			"Start Session"
		]
	},
	function(alexaReq, alexaRes) {
		var animalSession;
		var amzUserId;
		if (alexaReq.hasSession()) {
			var session = alexaReq.getSession();
			amzUserId = session.details.userId;
			animalSession = session.get('animalSession');

		} else {
			console.log("no session");
		}
		var reqOptions = {
			method: 'GET',
			uri: client_uri + 'deal/' + animalSession
		};

		return requestPromise(reqOptions)
			.then(function(jsonRes) {
				if (jsonRes) {
					alexaRes
						.say("Dealing cards")
						.reprompt("Please tell me another command")
						.shouldEndSession(false);
					console.log(jsonRes);
				} else {
					alexaRes
						.say("Unable to deal cards")
						.reprompt("Please tell me another command")
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

app.intent('HitIntent',
	{
		"slots": {},
		"utterances": [
			"Hit",
			"Hit me",
			"Do a hit"
		]
	},
	function(alexaReq, alexaRes) {
		var animalSession;
		var amzUserId;
		if (alexaReq.hasSession()) {
			var session = alexaReq.getSession();
			amzUserId = session.details.userId;
			animalSession = session.get('animalSession');

		} else {
			console.log("no session");
		}
		var reqOptions = {
			method: 'GET',
			uri: client_uri + 'hit/' + animalSession
		};

		return requestPromise(reqOptions)
			.then(function(jsonRes) {
				if (jsonRes) {
					alexaRes
						.say("Dealing player another card")
						.reprompt("Please tell me another command")
						.shouldEndSession(false);
					console.log(jsonRes);
				} else {
					alexaRes
						.say("Unable to hit")
						.reprompt("Please tell me another command")
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

app.intent('StandIntent',
	{
		"slots": {},
		"utterances": [
			"Stand",
			"Stay",
			"Hold"
		]
	},
	function(alexaReq, alexaRes) {
		var animalSession;
		var amzUserId;
		if (alexaReq.hasSession()) {
			var session = alexaReq.getSession();
			amzUserId = session.details.userId;
			animalSession = session.get('animalSession');

		} else {
			console.log("no session");
		}
		var reqOptions = {
			method: 'GET',
			uri: client_uri + 'stand/' + animalSession
		};

		return requestPromise(reqOptions)
			.then(function(jsonRes) {
				if (jsonRes) {
					alexaRes
						.say("Playing out dealer hand")
						.reprompt("Please tell me another command")
						.shouldEndSession(false);
					console.log(jsonRes);
				} else {
					alexaRes
						.say("Unable to stand")
						.reprompt("Please tell me another command")
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

// Error handling
app.error = function(err, alexaReq, alexaRes) {
	console.log(err)
	console.log(alexaReq);
	console.log(alexaRes);	
	alexaRes.say( 'an error error has occurred: ' + err);
};

module.exports = app;

