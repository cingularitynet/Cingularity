// utils/errors.js
// define all errors
// 
// All rights reserved. Modelo, Inc xx - 2016
//

var myError = {
    ERROR_S3DOWNLOAD:  301,   // s3 download error
    ERROR_S3UPLOAD:    302,   // s3 upload error
    ERROR_NOFILE:      404,   // no valid model file uploaded
    ERROR_CVTFAIL:     500    // converter excecutable fails
};


//function ErrorS3Download(message) {
//    var self = this;
//    Error.captureStackTrace(self, arguments.callee);
//    self.statusCode = 401;
//    self.message    = message;
//}

module.exports = myError;
