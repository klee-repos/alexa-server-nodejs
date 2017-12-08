
var User = require('../../models/User');
var client_uri = process.env.CLIENT_URI || "http://localhost:8080/";
var requestPromise = require('request-promise');

var ShowWeather = function(alexaReq, alexaRes) {
    var amzUserId, session, sessionCode;

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
            uri: client_uri + 'apps/weather/open/',
            headers: {
                sessionCode: sessionCode
            },
            json: true
        };
        return requestPromise(reqOptions)
            .then(function(jsonRes) {
                alexaRes
                    .say("")
                    .shouldEndSession(true);
            }).catch(function(err) {
                console.log(err);
                alexaRes
                    .say("Dash is having trouble opening weather.")
                    .shouldEndSession(true);
            });
    })
}

module.exports = ShowWeather;