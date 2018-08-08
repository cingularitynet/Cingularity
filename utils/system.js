// utils/system.js
// The wrapper of system calls and services
// 
// Hongwei Li (blifelee81@msn.com)
// All rights reserved. Modelo, Inc xx - 2015
//

var os         = require('os');
var Promise    = require('promise');
var fs         = require('fs');
var rimraf     = require('rimraf');
var mkdirp     = require('mkdirp');
var unzip      = require('node-unzip-2');
var zlib       = require('zlib');
var path       = require("path");
var childproc  = require('child_process');
var errcodes   = require('../utils/errors');

var mySystem = {};

var unzippedFileValid = function(ext) {
    return ext === ".json" ||
        ext === ".bin" ||
        ext === ".png" ||
        ext === ".jpeg" ||
        ext === ".jpg" ||
        ext === ".tif" ||
        ext === ".tiff" ||
        ext === ".3dm" ||
        ext === ".obj" ||
        ext === ".mtl" ||
        ext === ".rvt" ||
        ext === ".m3d" ||
        ext === ".vgx" ||
        ext === ".vgo" ||
        ext === ".stl" ||
        0;
};

// List all files in this directory. Return in absolute path.
mySystem.listFiles = function(directory) {
    var promise = new Promise(function(resolve, reject) {
        var callback = function(err, items) {
            if (err) {
                return reject(err);
            }
            var files = [];
            for (var i = 0, len = items.length; i < len; i++) {
                var filepath = path.resolve(directory, items[i]);
                var stat = fs.statSync(filepath);
                if (stat && stat.isFile()) {
                    files.push(filepath);
                }
            }
            resolve(files);
        }
        fs.readdir(directory, callback)
    });
    return promise;
};

// Delete the directory and all files inside it
mySystem.deleteDirectory = function(directory) {
    var promise = new Promise(function(resolve, reject) {
        var isExisted = fs.existsSync(directory);
        if (isExisted) {
            var callback = function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve(directory);
                }
            };
            rimraf(directory, callback);
        }
    });
    return promise;
};

mySystem.deleteFile = function(filePath) {
    var promise = new Promise(function(resolve, reject) {
        var isExisted = fs.existsSync(filePath);
        if (isExisted) {
            var callback = function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve(filePath);
                }
            };
            rimraf(filePath, callback);
        }
    });
    return promise;
};

// Make the directory 
mySystem.makeDirectory = function(directory) {
    return new Promise(function(resolve, reject) {
        if (fs.existsSync(directory)) {
            resolve(directory)
        } else { 
            var callback = function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve(directory);
                }
            };
            mkdirp(directory, callback);
        }
    });
};

// Execute an executable
mySystem.provoke = function(cmd, args, callback) {
    var cbk = function(err, stdout, stderr) {
        if (err) {
            //console.log(stdout);
            //console.log(stderr);
            callback(err);
        } else {
            callback(null);
        }
    };
    childproc.execFile(cmd, args, cbk);
};

//
// project directory
//
mySystem.getProjectRoot = function () {
    return path.join(__dirname, '..');
};

mySystem.getBinaryPath = function() {
    return path.join(this.getProjectRoot(), 'bin');
};

mySystem.getWorkspaceRoot = function () {
    return path.join(this.getProjectRoot(), 'workspace');
};

mySystem.getWorkSpacesRoot = function () {
    return path.join(this.getProjectRoot(), 'workspaces');
};

// Copy files from one directory to another
mySystem.copy = function(srcFilepath, dstFilepath) {

    return new Promise(function(resolve, reject) {
        if (srcFilepath === dstFilepath) {
            resolve(srcFilepath);
            return ;
        }

        fs.stat(srcFilepath, function(err, stats) {
            if (!err && stats.isFile()) {
                var inStream = fs.createReadStream(srcFilepath);
                var outStream = fs.createWriteStream(dstFilepath);
                inStream.on('error', function(err) {
                    reject(srcFilepath + " not readable");
                });
                outStream.on('error', function(err) {
                    reject("fail to write " + dstFilepath);
                });
                outStream.on('close', function(ex) {
                    resolve(dstFilepath);
                });
                inStream.pipe(outStream);
            } else {
                reject(srcFilepath + " not readable");
            }
        });
    });
};

// Unzip a file in workspace to workspace
mySystem.unzip = function(filepath, workspace) {
    var promise = new Promise(function(resolve, reject) {
        try {
            try {
                var stat = fs.statSync(filepath);
            } catch (e) {
                // An exception will be thrown when the filepath is not
                // existing.
            }
            if (!stat || !stat.isFile() || stat.size == 0) {
                var err = new Error("no valid model file uploaded (size = 0)");
                err.statusCode = 404;
                reject(err);
            }

            var readStream = fs.createReadStream(filepath);
            var fileNames = [];
            readStream.pipe(unzip.Parse()).on("entry", function(entry) {
                try {
                    var filePath = entry.path;
                    var fileName = path.basename(filePath);
                    var extName = path.extname(fileName).toLowerCase();

                    // As converter only recognizes ASCII filenames, 
                    // rename the file if it is not.
                    var isAncii = /^[\x00-\x7F]+$/.test(fileName);
                    if (!isAncii) {
                        var now = new Date();
                        fileName = 'f' + now.getTime() + extName;
                    }

                    // Filter out all directories and file under directories.
                    // only accept the pathname begin with "0-9" or "a-zA-Z"
                    // only accept the filename begin without "."
                    if (entry.type === "Directory" || 
                        /^[^0-9a-zA-Z].*$/.test(filePath) || 
                        fileName[0] === '.' ||
                        !unzippedFileValid(extName)) {
                        entry.autodrain();
                    } else {
                        fileNames.push(fileName)
                        entry.pipe(fs.createWriteStream(path.join(workspace, fileName)));
                    }
                } catch(err) {
                    reject(err);
                }
            }).on("close", function () {
                process.nextTick(function () {
                    resolve(fileNames);
                })
            }).on("error", function (err) {
                reject(err);
            });
        } catch (err) {
            reject(err);
        }
    });
    return promise;
};

// Zip a file in workspace directory to the same directory. Delete
// the original file if needed.
mySystem.zip = function(srcFilepath, dstFilepath, needDeleteSrcFile) {
    var promise = new Promise(function(resolve, reject) {
        try {
            if (!fs.existsSync(srcFilepath)) {
                d 
                reject("zip can't find " + filepath)
            }
            var inStream = fs.createReadStream(srcFilepath);
            var outStream = fs.createWriteStream(dstFilepath);
            outStream.on('unpipe', function () {
                if (needDeleteSrcFile) {
                    fs.unlinkSync(srcFilepath);
                }
                resolve(dstFilepath)
            });
            outStream.on('error', function (err) {
                reject(err);
            });
            inStream.pipe(zlib.createGzip()).pipe(outStream);
        } catch (err) {
            reject(err);
        }
    })
    return promise;
};

//TODO: the document of zlib is not very clear, the following function is a minimum implementation
mySystem.gunzip = function(filepath, workspace) {
    var promise = new Promise(function(resolve, reject) {
        try {
            try {
                var stat = fs.statSync(filepath);
            } catch (e) {
                // An exception will be thrown when the filepath is not
                // existing.
            }
            if (!stat || !stat.isFile() || stat.size == 0) {
                var err = new Error("no valid model file uploaded (size = 0)");
                err.statusCode = 404;
                reject(err);
            }
            var fileName = path.basename(filepath, '.gz');
            var destFilepath = path.join(workspace, fileName);
            var readStream = fs.createReadStream(filepath);
            var writeStream = fs.createWriteStream(destFilepath);
            writeStream.on('unpipe', function () {
                resolve([destFilepath])
            });
            writeStream.on('error', function (err) {
                reject(err);
            });
            readStream.pipe(zlib.createGunzip()).pipe(writeStream);
        } catch (err) {
            reject(err);
        }
    })
    return promise;
};

mySystem.randomString = function(length) {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for (var i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }

    return text;
};

mySystem.createWorkspace = function(workspacePath) {
    if (!workspacePath) {
        var now = new Date();
        var workspaceName = "" + now.getTime() + "_" + this.randomString(4);
        workspacePath = path.join(mySystem.getWorkspaceRoot(), workspaceName);
    }
    return mySystem.makeDirectory(workspacePath);
};

mySystem.isWin   = /^win/.test(process.platform);
mySystem.isLinux = /^linux/.test(process.platform);
mySystem.isMacOS = /^darwin/.test(process.platform);

module.exports = mySystem;

