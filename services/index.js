// services/index.js
// Export two kinds of servers (production and debug)
// 
// All rights reserved. Modelo, Inc xx - 2016
//

var global = require("../global");

module.exports = {};

module.exports.amqpd   = require('./amqpd'); // amqp protocol, used in production
module.exports.httpd   = require('./httpd'); // http protocol, used in debug
module.exports.s3      = require('./s3'); // s3 
module.exports.sentryd = require('./sentryd'); // sentry
module.exports.db      = require('./db'); // database
