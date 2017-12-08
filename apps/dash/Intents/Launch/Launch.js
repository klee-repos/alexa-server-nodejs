
var User = require('../../models/User');

var Launch = function(alexaReq, alexaRes) {
    var amzUserId, session;
    var newPlayer = true;
    
    if (alexaReq.hasSession()) {
        var session = alexaReq.getSession();
        amzUserId = session.details.userId;
    } 
    
    return User.findOne({amzUserId: amzUserId}, function(err, resSession) {
        if (resSession) {
            newPlayer = false;
            session.set('sessionCode', resSession.sessionCode);
        } else {
            newPlayer = true;
        }
    }).then(function() {
        if (newPlayer) {
            alexaRes
                .say("Welcome to Dash. Please tell Dash the 4 digit number on your screen.")
                .shouldEndSession(true);
        } else {
            alexaRes
                .say("Connected to Dash. Please tell Dash a command.")
                .shouldEndSession(true);
        }
    })
}

module.exports = Launch;
