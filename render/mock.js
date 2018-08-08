// render/mock.js
// Construct a vray rendering command line
// 
// All rights reserved. Modelo, Inc xx - 2016
//

var system  = require("../utils/system");
var path    = require("path");
var configs = require("../global").config();

var myMock = {};

myMock.createRenderCommand = function(req) {
    var cmdline = {
        "exec":   null, 
        "output": null,
        "args":   [], 
    };

    if (system.isWin) {
        // Windows
        cmdline.exec = path.join(system.getBinaryPath(), "win64", "mock", "mock_renderer.exe");
    } else {
        // Linux
        cmdline.exec = path.join(system.getBinaryPath(), "linux64", "mock", "mock_renderer");
    }

    cmdline.output = path.join(req.workspace, req.sessionId + "__" + req.workId + "." + configs.imageFormat);

    var x0 = req.subregion[0];
    var y0 = req.subregion[1];
    var x1 = req.subregion[0] + req.subregion[2];
    var y1 = req.subregion[1] + req.subregion[3];

    cmdline.args = [
        "-id=" + req.workId +
        "-display=0", // disable render window
        "-sceneFile=" + req.localFilepaths[0],
        "-imgWidth=" + req.resolution[0],
        "-imgHeight=" + req.resolution[1],
        "-region=" + x0 + ";" + y0 + ";" + x1 + ";" + y1,
        "-crop=" + x0 + ";" + y0 + ";" + x1 + ";" + y1,
        "-showProgress=2",
        "-progressIncrement=5",
        "-imgFile=" + cmdline.output];

    return cmdline;
};

myMock.createConvertCommand = function(req) {
    var cmdline = {
        "exec": null, 
        "args": [], 
    };

    cmdline.exec = path.join(system.getBinaryPath(), "vray", "mx.vrs.exe");

    cmdline.args = [
        req.localFilepaths[0],
        path.join(req.workspace, "main.ass")
    ];

    return cmdline;
};

myMock.isSceneFile = function(file) {
    return path.extname(file) === ".vrscene";
};

myMock.reportProgress = function(str) {
    var matched = str.match(/Rendering image...:\s+(\d+.\d+)%/);
    if (matched) {
        return matched[1];
    }
    return null;
};

module.exports = myMock;
