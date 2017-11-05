
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var flipSchema = new Schema({
	name: String,
	created: Date
});

var Flip = mongoose.model('Flip', flipSchema);

module.exports = Flip;
