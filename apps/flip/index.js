
'use strict';

var alexa = require('alexa-app');
var app = new alexa.app('flip');


app.launch(function(request, response) {
	response.say("Welcome my friend. Who wants to do a flip?").reprompt("Who wants to do a flip?").shouldEndSession(false);
});

app.error = function(exception, request, response) {
	console.log(exception)
	console.log(request);
	console.log(response);	
	response.say( 'The following error has occurred. ' + error.message);
};

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
    var name = request.slot('FirstName');
    response.say(name + " wants to do a flip!").shouldEndSession(false);
    response.say("Would you like to hear a quote?");
  }
);

app.intent("QuoteIntent",
	{
		"utterances": [
			"Tell me a quote",
			"Yes",
			"I would love to hear a quote",
			"Yes, I would like to hear a quote",
			"Yes, I would like to hear one"
		]
	},
	function (request, response) {
		response.say("Gavin looves to do flips!").shouldEndSession(true);
	}
)

module.exports = app;