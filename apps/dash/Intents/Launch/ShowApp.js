
var User = require('../../models/User');
var client_uri = process.env.CLIENT_URI || "http://localhost:8080/";
var requestPromise = require('request-promise');

var ShowApp = function(alexaReq, alexaRes) {
    var app = alexaReq.slot('AppName');
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
        var endpoint = '';
        console.log(app);
        if (app === 'weather') {
            endpoint = 'apps/weather/open/';
        }
        if (app === 'bitcoin' || app === 'ethereum' || app === 'ether' || app === 'coinbase') {
            endpoint = 'apps/gdax/open/'
        }
        if (app === 'twenty one' || app === 'blackjack' || app === 'black jack') {
            endpoint = 'apps/blackjack/open/'
        }
        var reqOptions = {
            method: 'POST',
            uri: client_uri + endpoint,
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
                alexaRes
                    .say("Dash is having trouble opening" + app)
                    .shouldEndSession(true)
            });
    })
}

module.exports = ShowApp;