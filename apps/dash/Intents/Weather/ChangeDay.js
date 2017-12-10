
var User = require('../../models/User');
var client_uri = process.env.CLIENT_URI || "http://localhost:8080/";
var requestPromise = require('request-promise');

var ChangeDay = function(alexaReq, alexaRes) {
    var amzUserId, session, sessionCode;
    var day = alexaReq.slot('Day');

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
            uri: client_uri + 'apps/weather/changeActiveDay/',
            headers: {
                sessionCode: sessionCode
            },
            body : {
                day: day,
            },
            json: true
        }
        return requestPromise(reqOptions)
            .then(function(jsonRes) {
                if (jsonRes !== null) {
                    alexaRes
                        .say("")
                        .shouldEndSession(true);
                } else {
                    alexaRes
                        .say("Dash was unable to change the forecast.")
                        .shouldEndSession(true);
                }
            }).catch(function(err) {
                console.log(err);
                alexaRes
                    .say("Dash is having trouble configuring weather;")
                    .shouldEndSession(true);
            });
    })
}

module.exports = ChangeDay;