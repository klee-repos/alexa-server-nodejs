//module.change_code = 1;
'use strict';

var alexa = require('alexa-app');
var app = new alexa.app('flip');


app.launch(function(request, response) {
	response.say( 'Welcome. Who wants to do a flip?' ).reprompt( 'Who wants to do a flip?' ).shouldEndSession( false );
});

app.error = function( exception, request, response ) {
	console.log(exception)
	console.log(request);
	console.log(response);	
	response.say( 'The followning error has occurred. ' + error.message);
};

app.intent('FlipIntent',
  {
    "slots":{"name":"FirstName"}
	,"utterances":[ 
		"{FirstName} wants to do a flip",
		"{FirstName}",
		"{FirstName} is gonna do a flip"
	]
  },
  function(request,response) {
    var name = request.slot('name');
    response.say(name + " wants to do a flip!");
  }
);

module.exports = app;