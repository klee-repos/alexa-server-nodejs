// Request promise
var requestPromise = require('request-promise');

// Alexa App framework
var alexa = require('alexa-app');
var app = new alexa.app('dash');

// Use global environmental variables
var dotenv = require('dotenv').config();

// Configuration variables
var client_uri = process.env.CLIENT_URI || "http://localhost:8080/";
var db_uri = process.env.DB_URI;

// Connection to MongoDB Altas via mongoose
var mongoose = require("mongoose");
var Session = require('./models/Session');

mongoose.connect(db_uri, {useMongoClient: true}, function(err) {
	if (err) console.log("Mongoose error: " + err);
});

// Launch
app.launch(function(alexaReq, alexaRes) {
	var amzUserId, session, sessionCode;
	var newPlayer = true;
	
	if (alexaReq.hasSession()) {
		session = alexaReq.getSession();
		amzUserId = session.details.userId;
	} 

	return Session.findOne({amzUserId: amzUserId}, function(err, resSession) {
		if (resSession) {
			newPlayer = false;
			sessionCode = resSession.sessionCode;
			session.set('sessionCode', resSession.sessionCode);
		} else {
			newPlayer = true;
		}
	}).then(function() {
		if (newPlayer) {

			alexaRes
			.say("<speak>Welcome to Dash. <break time='2s'/> What session would you like to connect to?</speak>")
			.reprompt("Please say the four digit session number you'd like to connect to.")
			.shouldEndSession(false);
		} else {
			alexaRes.say("Connected to Dash").reprompt("Commands are in red.").shouldEndSession(false);
		}
	})
});


app.intent("ConnectSessionIntent",
	{
		"slots":{"SessionCode":"AMAZON.FOUR_DIGIT_NUMBER"},
		"utterances": [
			"Connect to {SessionCode}",
			"Connect me to {SessionCode}",
			"{SessionCode}",
			"I would like to connect to {SessionCode}"
		]
	},
	function(alexaReq, alexaRes) {
		var sessionCode = alexaReq.slot('SessionCode');
		var amzUserId;
		if (alexaReq.hasSession()) {
			var session = alexaReq.getSession();
			amzUserId = session.details.userId; 
			session.set('sessionCode', sessionCode);
		}

		var reqOptions = {
			method: 'POST',
			uri: client_uri + 'connect',
			body : {
				sessionCode: sessionCode,
				amzUserId: amzUserId
			},
			json: true
		};
		return requestPromise(reqOptions)
			.then(function(jsonRes) {
				if (jsonRes.status === 'created') {
					alexaRes
					.say("Sucessfully linked Amazon account to session number. Commands are highlighted in red.")
					.reprompt("Commands are highlighted in red.")
					.shouldEndSession(false);
				} 
				
				if (jsonRes.status === 'existing') {
					alexaRes
					.say("Session code is already linked with another Amazon account. Please choose another.")
					.reprompt("Please say the session number.")
					.shouldEndSession(false);
				}
				if (!jsonRes.status) {
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
		var animalSession, amzUserId, sessionCode;
		if (alexaReq.hasSession()) {
			var session = alexaReq.getSession();
			amzUserId = session.details.userId;
			sessionCode = session.get('sessionCode');

		} else {
			console.log("no session");
		}
		if (sessionCode) {
			alexaRes
				.say("You are connected to " + sessionCode + "." + "Commands are highlighted in red.")
				.reprompt("Commands are highlighted in red.")
				.shouldEndSession(false);
		} else {
			alexaRes
				.say("You are not connected to a session. What session would you like to connect to?")
				.reprompt("What session would you like to connect to?")
				.shouldEndSession(false);
		}
	}
)

app.intent('OpenTwentyOneIntent', 
	{
		"slots": {},
		"utterances":[
			"Open Twenty One",
			"Open 21",
			"Open blackjack",
			"Open black jack"
		]
	},
	function(alexaReq, alexaRes) {
		var session, sessionCode;
		if (alexaReq.hasSession()) {
			session = alexaReq.getSession();
			sessionCode = session.get('sessionCode');
		}

		var reqOptions = {
			method: 'POST',
			uri: client_uri + 'apps/blackjack/start',
			body : {
				sessionCode: sessionCode
			},
			json: true
		};
		return requestPromise(reqOptions)
			.then(function(jsonRes) {
				if (jsonRes.status === 'started') {
					alexaRes
					.say("Twenty One opened.")
					.reprompt("Commands are highlighted in red.")
					.shouldEndSession(false);
				} else {
					alexaRes
						.say("Can you repeat your command?")
						.reprompt("Can you repeat your command?")
						.shouldEndSession(false);
				}
			}).catch(function(err) {
				console.log(err);
				alexaRes
					.say("I am having trouble. Can you repeat your command?")
					.reprompt("Can you repeat your command?")
					.shouldEndSession(false);
			});
	}
)

app.intent('CloseTwentyOneIntent', 
{
	"slots": {},
	"utterances":[
		"Close Twenty One",
		"Close 21",
		"Close blackjack",
		"Close black jack"
	]
},
function(alexaReq, alexaRes) {
	var session, sessionCode;
	if (alexaReq.hasSession()) {
		session = alexaReq.getSession();
		sessionCode = session.get('sessionCode');
	}

	var reqOptions = {
		method: 'POST',
		uri: client_uri + 'apps/blackjack/stop',
		body : {
			sessionCode: sessionCode
		},
		json: true
	};
	return requestPromise(reqOptions)
		.then(function(jsonRes) {
			if (jsonRes.status === 'stopped') {
				alexaRes
				.say("Twenty One closed.")
				.reprompt("Commands are highlighted in red.")
				.shouldEndSession(false);
			} else {
				alexaRes
					.say("Can you repeat your command?")
					.reprompt("Can you repeat your command?")
					.shouldEndSession(false);
			}
		}).catch(function(err) {
			console.log(err);
			alexaRes
				.say("I am having trouble. Can you repeat your command?")
				.reprompt("Can you repeat your command?")
				.shouldEndSession(false);
		});
	}
)

app.intent('DealTwentyOneIntent', 
{
	"slots": {},
	"utterances":[
		"Deal",
		"New game",
		"Deal cards",
		"New hand"
	]
},
function(alexaReq, alexaRes) {
	var session, sessionCode;
	if (alexaReq.hasSession()) {
		session = alexaReq.getSession();
		sessionCode = session.get('sessionCode');
	}

	var reqOptions = {
		method: 'POST',
		uri: client_uri + 'apps/blackjack/deal',
		body : {
			sessionCode: sessionCode
		},
		json: true
	};
	return requestPromise(reqOptions)
		.then(function(jsonRes) {
			console.log(jsonRes)
			if (jsonRes.result) {
				alexaRes
					.say("Game over.")
					.reprompt("Commands are highlighted in red.")
					.shouldEndSession(false);
			} else {
				alexaRes
					.say("Cards dealt.")
					.reprompt("Commands are highlighted in red.")
					.shouldEndSession(false);
			}
		}).catch(function(err) {
			console.log(err);
			alexaRes
				.say("I am having trouble. Can you repeat your command?")
				.reprompt("Can you repeat your command?")
				.shouldEndSession(false);
		});
	}
)

app.intent('HitTwentyOneIntent', 
{
	"slots": {},
	"utterances":[
		"Hit",
	]
},
function(alexaReq, alexaRes) {
	var session, sessionCode;
	if (alexaReq.hasSession()) {
		session = alexaReq.getSession();
		sessionCode = session.get('sessionCode');
	}

	var reqOptions = {
		method: 'POST',
		uri: client_uri + 'apps/blackjack/hit',
		body : {
			sessionCode: sessionCode
		},
		json: true
	};
	return requestPromise(reqOptions)
		.then(function(jsonRes) {
			console.log(jsonRes)
			if (jsonRes.result) {
				alexaRes
				.say("Game over.")
				.reprompt("Commands are highlighted in red.")
				.shouldEndSession(false);
			} else {
				alexaRes
					.say("Hit.")
					.reprompt("Commands are highlighted in red.")
					.shouldEndSession(false);
			}
		}).catch(function(err) {
			console.log(err);
			alexaRes
				.say("I am having trouble. Can you repeat your command?")
				.reprompt("Can you repeat your command?")
				.shouldEndSession(false);
		});
	}
)

app.intent('StandTwentyOneIntent', 
{
	"slots": {},
	"utterances":[
		"Stand",
		"Stay",
	]
},
function(alexaReq, alexaRes) {
	var session, sessionCode;
	if (alexaReq.hasSession()) {
		session = alexaReq.getSession();
		sessionCode = session.get('sessionCode');
	}

	var reqOptions = {
		method: 'POST',
		uri: client_uri + 'apps/blackjack/stand',
		body : {
			sessionCode: sessionCode
		},
		json: true
	};
	return requestPromise(reqOptions)
		.then(function(jsonRes) {
			console.log(jsonRes)
			if (jsonRes.result) {
				alexaRes
				.say("Game over.")
				.reprompt("Commands are highlighted in red.")
				.shouldEndSession(false);
			} else {
				alexaRes
					.say("Hit.")
					.reprompt("Commands are highlighted in red.")
					.shouldEndSession(false);
			}
		}).catch(function(err) {
			console.log(err);
			alexaRes
				.say("I am having trouble. Can you repeat your command?")
				.reprompt("Can you repeat your command?")
				.shouldEndSession(false);
		});
	}
)

app.intent("AMAZON.CancelIntent",
{
	"slots": {},
	"utterances": []
},
function(request, response) {
	response
		.say("Command cancelled.")
		.reprompt("What session would you like to connect to?")
		.shouldEndSession(false);
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

