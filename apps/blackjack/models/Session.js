var mongoose = require('mongoose');

var sessionSchema = new mongoose.Schema(
	{
		_id: Number,
		began: {type:Date, default:Date.now},
		name: Number,
		amzUserId: String
	});

var Session = mongoose.model('Session', sessionSchema);

module.exports = Session;