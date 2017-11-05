
'use strict';

var alexa = require('alexa-app');
var app = new alexa.app('flip');

// Connection to MongoDB Atlas
var MongoClient = require("mongodb").MongoClient;
var uri = "mongodb://lynkr:aviademy@test-shard-00-00-mlsxy.mongodb.net:27017,test-shard-00-01-mlsxy.mongodb.net:27017,test-shard-00-02-mlsxy.mongodb.net:27017/test?ssl=true&replicaSet=test-shard-0&authSource=admin";
var database;

MongoClient.connect(uri, function(err, db) {
	if (err) {
		console.log("MongoDB error: " + err);
	} else {
		database = db;
		console.log("Sucessfully connected to MongoDB Atlas");
	}
})


app.launch(function(request, response) {
	response.say("Who wants to do a flip?").reprompt("Who wants to do a flip?").shouldEndSession(false);
});

app.error = function(exception, request, response) {
	console.log(exception)
	console.log(request);
	console.log(response);	
	response.say( 'The following error has occurred. ' + error.message);
};

app.intent("GetRequestsIntent", 
	{
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

app.intent("SecretIntent",
	{
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

module.exports = app;