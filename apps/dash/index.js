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
		var session = alexaReq.getSession();
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
			.say("<speak>Welcome to Dash.</speak>")
			.reprompt("Please say the four digit session number you'd like to connect to.")
			.shouldEndSession(false);
		} else {
			alexaRes.say("Connected to Dash").reprompt("gavin loves flips").shouldEndSession(false);
		}
	})
});


app.intent("ConnectSessionIntent",
	{
		"slots":{"connectCode":"AMAZON.FOUR_DIGIT_NUMBER"},
		"utterances": [
			"to launch {connectCode}",
			"launch code {connectCode}"
		]
	},
	function(alexaReq, alexaRes) {
		var connectCode = alexaReq.slot('connectCode');
		var amzUserId;

		if (alexaReq.hasSession()) {
			var session = alexaReq.getSession();
			amzUserId = session.details.userId; 
		}

		var reqOptions = {
			method: 'POST',
			uri: client_uri + 'connect',
			body : {
				connectCode: connectCode,
				amzUserId: amzUserId
			},
			json: true
		};
		return requestPromise(reqOptions)
			.then(function(jsonRes) {
				if (jsonRes) {
					session.set('sessionCode', jsonRes);
					alexaRes
					.say("Sucessfully launched")
					.shouldEndSession(true);
				} 
				if (!jsonRes) {
					alexaRes
					.say("This code is already linked with another Amazon account.")
					.shouldEndSession(true);
				}
			}).catch(function(err) {
				console.log(err);
				alexaRes
					.say("I am having trouble connecting.")
					.shouldEndSession(true);
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
		var amzUserId, sessionCode;
		if (alexaReq.hasSession()) {
			var session = alexaReq.getSession();
			amzUserId = session.details.userId;
		} else {
			console.log("no session");
		}
		return Session.findOne({amzUserId: amzUserId}, function(err, resSession) {
			if (resSession) {
				session.set('sessionCode', resSession.sessionCode);
				sessionCode = session.get('sessionCode');
			} else {
				console.log('no session found')
			}
		}).then(function() {
			if (sessionCode) {
				alexaRes
					.say("You are connected to " + sessionCode + ".")
					.shouldEndSession(true);
			} else {
				alexaRes
					.say("You are not connected to a session.")
					.shouldEndSession(true);
			}
		})
	}
)

app.intent('OpenTwentyOneIntent', 
	{
		"slots": {},
		"utterances":[
			"Open Twenty One",
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
					.say("Opened.")
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
					.say("I am having trouble. <break time='1s'> Can you repeat your command?")
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
				.say("Closed.")
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
			if (jsonRes.result === 'Dealer wins - Blackjack') {
				alexaRes
					.say("<speak>Blackjack. <break time='1s' /> Dealer wins.</speak>")
					.reprompt("Commands are highlighted in red.")
					.shouldEndSession(false);
			} 
			if (jsonRes.result === 'Player wins - Blackjack') {
				alexaRes
					.say("<speak>Blackjack. <break time='1s' /> Player wins.</speak>")
					.reprompt("Commands are highlighted in red.")
					.shouldEndSession(false);
			}
			if (jsonRes.result === 'Player lose - Bust') {
				alexaRes
					.say("<speak>Bust. <break time='1s' /> Dealer wins.</speak>")
					.reprompt("Commands are highlighted in red.")
					.shouldEndSession(false);
			}
			if (jsonRes.result === 'Player wins - dealer bust') {
				alexaRes
					.say("<speak>Bust. <break time='1s' /> Player wins.</speak>")
					.reprompt("Commands are highlighted in red.")
					.shouldEndSession(false);
			}
			if (jsonRes.result === 'Push') {
				alexaRes
					.say("<speak>Push. <break time='1s' /> Game is a draw.</speak>")
					.reprompt("Commands are highlighted in red.")
					.shouldEndSession(false);
			}
			if (jsonRes.result === null) {
				alexaRes
					.say("<speak><prosody rate='fast'>Good luck.</prosody></speak>")
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
			if (jsonRes.result === 'Dealer wins - Blackjack') {
				alexaRes
					.say("<speak>Blackjack. <break time='1s' /> Dealer wins.</speak>")
					.reprompt("Commands are highlighted in red.")
					.shouldEndSession(false);
			} 
			if (jsonRes.result === 'Player wins - Blackjack') {
				alexaRes
					.say("<speak>Blackjack. <break time='1s' /> Player wins.</speak>")
					.reprompt("Commands are highlighted in red.")
					.shouldEndSession(false);
			}
			if (jsonRes.result === 'Player lose - Bust') {
				alexaRes
					.say("<speak>Bust. <break time='1s' /> Dealer wins.</speak>")
					.reprompt("Commands are highlighted in red.")
					.shouldEndSession(false);
			}
			if (jsonRes.result === 'Player wins - dealer bust') {
				alexaRes
					.say("<speak>Bust. <break time='1s' /> Player wins.</speak>")
					.reprompt("Commands are highlighted in red.")
					.shouldEndSession(false);
			}
			if (jsonRes.result === 'Push') {
				alexaRes
					.say("<speak>Push. <break time='1s' /> Game is a draw.</speak>")
					.reprompt("Commands are highlighted in red.")
					.shouldEndSession(false);
			}
			if (jsonRes.result === null) {
				alexaRes
					.say(".")
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
			if (jsonRes.result === 'Dealer wins - Blackjack') {
				alexaRes
					.say("<speak>Blackjack. <break time='1s' /> Dealer wins.</speak>")
					.reprompt("Commands are highlighted in red.")
					.shouldEndSession(false);
			} 
			if (jsonRes.result === 'Player wins - Blackjack') {
				alexaRes
					.say("<speak>Blackjack. <break time='1s' /> Player wins.</speak>")
					.reprompt("Commands are highlighted in red.")
					.shouldEndSession(false);
			}
			if (jsonRes.result === 'Player wins - closer to 21') {
				alexaRes
					.say("<speak>Player is closer to 21. <break time='1s' /> Player wins.</speak>")
					.reprompt("Commands are highlighted in red.")
					.shouldEndSession(false);
			}
			if (jsonRes.result === 'Dealer wins - closer to 21') {
				alexaRes
					.say("<speak>Dealer is closer to 21. <break time='1s' /> Dealer wins.</speak>")
					.reprompt("Commands are highlighted in red.")
					.shouldEndSession(false);
			}
			if (jsonRes.result === 'Push') {
				alexaRes
					.say("<speak>Push. <break time='1s' /> Game is a draw.</speak>")
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

