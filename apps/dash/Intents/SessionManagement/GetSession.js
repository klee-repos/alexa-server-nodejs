var User = require('../../models/User');

var GetSession = function(alexaReq, alexaRes) {
    var amzUserId, session;

    if (alexaReq.hasSession()) {
        session = alexaReq.getSession();
        amzUserId = session.details.userId;
    }
    return User.findOne({amzUserId: amzUserId}, function(err, resSession) {
        if (resSession) {
            session.set('sessionCode', resSession.sessionCode);
        }
    }).then(function() {
        if (session.get('sessionCode') !== null) {
            alexaRes
                .say("")
                .shouldEndSession(true);
        } else {
            alexaRes
                .say("You are not connected to a Dash session.")
                .shouldEndSession(true);
        }
    })
}

module.exports = GetSession;