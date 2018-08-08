// services/s3.js
// The wrapper of s3
// 
// All rights reserved. Modelo, Inc xx - 2016
//

var knox      = require("knox");
var Promise   = require("promise");
var path      = require("path");
var fs        = require('fs');
var configs   = require("../global").config();
var logger    = require("../utils/log");
var errcodes  = require("../utils/errors");

var myS3 = {};

var clients = {};

var GetS3Client = function(bucket1) {
    if (!clients[bucket1]) {
        var knoxOptions = {
            key: configs.awsS3AccessKeyId,
            secret: configs.awsS3SecretAccessKey,
            region: configs.awsS3Region,
            bucket: bucket1
        }
        clients[bucket1] = knox.createClient(knoxOptions)
    }
    return clients[bucket1];
};

var ClearS3Folder = function(bucket, keyOfFolder) {
    var keyOfFolder = keyOfFolder[keyOfFolder.length - 1] == '/' ? keyOfFolder : keyOfFolder + '/';
    return new Promise(function (resolve, reject) {
        var client = GetS3Client(bucket);
        var listCallback = function (err, data) {
            if (err) {
                return reject(err);
            }
            if (data.IsTruncated) {
                var err = new Error();
                err.message = "cannot handle more than 1000 objects";
                reject(err);
            }
            var files = data.Contents;
            var fileKeyList = [];
            var dirKeyList = [];
            files.forEach(function (fileObj) {
                var key = fileObj.Key;
                if (key[key.length - 1] == '/') {
                    dirKeyList.push(key);
                } else {
                    fileKeyList.push(key);
                }
            });
            client.deleteMultiple(fileKeyList, function (err, res) {
                if (err) {
                    return reject(err);
                } else {
                    client.deleteMultiple(dirKeyList, function (err, res) {
                        if (err) {
                            return reject(err);
                        } else {
                            resolve(null);
                        }
                    })
                }
            });
        }
        client.list({prefix: keyOfFolder}, listCallback);
    });
};

function UploadToS3(bucket, key, filepath) {
    var promise = new Promise(function(resolve, reject) {

        var client = GetS3Client(bucket);
        var callback = function(err, res) {
            if (err) {
                reject(err);
            } else {
                var s3Entry = {
                    s3FileName      : path.basename(filepath),
                    s3Bucket        : bucket,
                    s3Key           : key,
                    s3Path          : 'https://' + bucket + '.' + configs.awsS3EndPoint + '/' + key
                };
                resolve(s3Entry);
            }
        }

        var headers = {};
        headers['Access-Control-Expose-Headers'] = 'Content-Length';
        // FIXME: will S3 automatically unzip it? It is not what we want.
        if (path.extname(filepath) === '.gz') {
            headers['Content-Encoding'] = 'gzip';
        }

        client.putFile(filepath, key, headers, callback);
    });
    return promise;
};

myS3.download = function(s3Bucket, s3Key, s3Path, workspace) {
    return new Promise(function(resolve, reject) {
        var s3Client      = GetS3Client(s3Bucket);
        var localFilename = path.basename(s3Path);

        s3Client.getFile(s3Key, function(err, res) {
            if (err) {
                reject(err);
            } else {
                var isAncii = /^[\x00-\x7F]+$/.test(localFilename);
                if (!isAncii) {
                    // because converter only recognized AncII filename
                    // rename file if it is not.
                    var extName = path.extname(localFilename);
                    var now = new Date();
                    localFilename = 'f' + now.getTime() + extName;
                }
                var filepath = path.join(workspace, localFilename);
                var outStream = fs.createWriteStream(filepath);
                outStream.on('unpipe', function() {
                    resolve(filepath);
                });
                outStream.on('error', function(err) {
                    reject(err);
                });
                res.pipe(outStream);
            }
        });
    });
};

// if overwrite is true, we clear the folder specified with key before upload.
myS3.upload = function(s3Bucket, s3ParentKey, filepath, overwrite) {
    function UploadFile(s3Bucket, s3ParentKey, filepath) {
        var filename = path.basename(filepath);
        var s3Key = [s3ParentKey, filename].join('/');
        return UploadToS3(s3Bucket, s3Key, filepath);
    }

    if (overwrite) {
        // Clean up the existing files in the folder.
        return ClearS3Folder(s3Bucket, s3ParentKey)
            .then(function() {
                return UploadFile(s3Bucket, s3ParentKey, filepath);
            });
    } else {
        return UploadFile(s3Bucket, s3ParentKey, filepath);
    }
};

module.exports = myS3;
