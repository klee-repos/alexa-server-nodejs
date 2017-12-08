
var User = require('../../models/User');
var client_uri = process.env.CLIENT_URI || "http://localhost:8080/";
var requestPromise = require('request-promise');

var StandTwentyOne = function(alexaReq, alexaRes) {
	var amzUserId, session, sessionCode;
    var location = alexaReq.slot('location');

    if (alexaReq.hasSession()) {
        session = alexaReq.getSession();
        amzUserId = session.details.userId;
    }
    return User.findOne({amzUserId: amzUserId}, function(err, resSession) {
        if (resSession) {
            session.set('sessionCode', resSession.sessionCode);
            sessionCode = resSession.sessionCode;
        }
    }).then(function() {
		var reqOptions = {
			method: 'POST',
			uri: client_uri + 'apps/blackjack/stand',
			headers: {
                sessionCode: sessionCode
            },
			json: true
		};
		return requestPromise(reqOptions)
			.then(function(jsonRes) {
				if (jsonRes.result === 'Dealer wins - Blackjack') {
					alexaRes
						.say("Blackjack. Dealer wins.")
						.shouldEndSession(true);
				} 
				if (jsonRes.result === 'Player wins - Blackjack') {
					alexaRes
						.say("Blackjack. Player wins.")
						.shouldEndSession(true);
				}
				if (jsonRes.result === 'Player lose - Bust') {
					alexaRes
						.say("Bust. Dealer wins.")
						.shouldEndSession(true);
				}
				if (jsonRes.result === 'Player wins - dealer bust') {
					alexaRes
						.say("Bust. Player wins.")
						.shouldEndSession(true);
				}
				if (jsonRes.result === 'Push') {
					alexaRes
						.say("Push. Tie game.")
						.shouldEndSession(true);
				}
				if (jsonRes.result === null) {
					alexaRes
						.say("Good luck.")
						.shouldEndSession(true);
				}
			}).catch(function(err) {
				console.log(err);
				alexaRes
					.say("Dash is having trouble completing deal.")
					.shouldEndSession(true);
			});
	})
}

module.exports = StandTwentyOne;