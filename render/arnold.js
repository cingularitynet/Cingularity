// render/arnold.js
// Construct an arnold rendering command line
// 
// All rights reserved. Modelo, Inc xx - 2016
//

var system  = require("../utils/system");
var path    = require("path");
var configs = require("../global").config();

var myArnold = {};

myArnold.createRenderCommand = function(req) {
    var cmdline = {
        "exec":   null, 
        "output": null,
        "args":   [], 
    };

    if (system.isWin) {
        // Windows
        cmdline.exec = path.join(system.getBinaryPath(), "win64", "arnold", "kick");
    } else {
        // Linux
        cmdline.exec = path.join(system.getBinaryPath(), "linux64", "arnold", "kick");
    }

    cmdline.output = path.join(req.workspace, req.sessionId + "__" + req.workId + "." + configs.imageFormat);

    cmdline.args = [
        "-nstdin", // disable stdin input
        "-dp", // disable progressive rendering
        "-dw", // disable render window
        "-i",
        req.localFilepaths[0],
        "-r",
        req.resolution[0],
        req.resolution[1],
        "-rg",
        req.subregion[0],
        req.subregion[1],
        req.subregion[0] + req.subregion[2] - 1,
        req.subregion[1] + req.subregion[3] - 1,
        "-v",
        2,
        "-of",
        configs.imageFormat,
        "-o",
        cmdline.output];

    return cmdline;
};

myArnold.createConvertCommand = function(req) {
    var cmdline = {
        "exec": null, 
        "args": [], 
    };

    cmdline.exec = path.join(system.getBinaryPath(), "arnold", "mx.ass.exe");

    cmdline.args = [
        req.localFilepaths[0],
        path.join(req.workspace, "main.ass")
    ];

    return cmdline;
};

myArnold.isSceneFile = function(file) {
    return path.extname() === ".ass";
};

myArnold.reportProgress = function(str) {
    var matched = str.match(/(\d+)%\sdone\s-\s\d+ rays/);
    if (matched) {
        return matched[1];
    }
    return null;
};

module.exports = myArnold;
