
var mongoose = require("mongoose");

var userSchema = new mongoose.Schema(
{
	began: {type:Date, default:Date.now},
	sessionCode: String,
	amzUserId: String,
	preferences: Object
});

var User = mongoose.model('User', userSchema);

module.exports = User;