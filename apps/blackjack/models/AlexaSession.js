var mongoose = require('mongoose');

var sessionSchema = new mongoose.Schema(
	{
		began: {type:Date, default:Date.now},
		amzUserId: String,
		sessionCode: Number
	});

var AlexaSession = mongoose.model('AlexaSession', sessionSchema);

module.exports = AlexaSession;