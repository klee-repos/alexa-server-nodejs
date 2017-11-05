
'use strict';

var alexa = require('alexa-app');
var app = new alexa.app('flip');


app.launch(function(request, response) {
	response.say("Who wants to do a flip?").reprompt("Who wants to do a flip?").shouldEndSession(false);
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
    response.say(name + " wants to do a flip!");
    response.say("Want to know a secret?").reprompt("Want to know a secret?").shouldEndSession(false);
  }
);

app.intent("QuoteIntent",
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
	}
)

module.exports = app;