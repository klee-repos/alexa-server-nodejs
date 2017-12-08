var client_uri = process.env.CLIENT_URI || "http://localhost:8080/";
var requestPromise = require('request-promise');

var ConnectSession = function(alexaReq, alexaRes) {
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
                    .say("")
                    .shouldEndSession(true);
            } 
            if (!jsonRes) {
                alexaRes
                    .say("Dash has already linked this code to another amazon account.")
                    .shouldEndSession(true);
            }
        }).catch(function(err) {
            console.log(err);
            alexaRes
                .say("Dash is having trouble connecting.")
                .shouldEndSession(true);
        });
}

module.exports =  ConnectSession;