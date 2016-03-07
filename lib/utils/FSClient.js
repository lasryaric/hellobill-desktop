
var knox = require('knox');
var bluebird = require('bluebird')



var fsClient = knox.createClient({
	key: process.env.AWS_KEY,
	secret: process.env.AWS_SECRET,
	bucket: process.env.AWS_BUCKET,
});
bluebird.promisifyAll(fsClient);

module.exports = fsClient;
