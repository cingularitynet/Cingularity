// render/vray.js
// Construct a vray rendering command line
// 
// All rights reserved. Modelo, Inc xx - 2016
//

var system  = require("../utils/system");
var path    = require("path");
var configs = require("../global").config();

var myVRay = {};

myVRay.createRenderCommand = function(req) {
    var cmdline = {
        "exec":   null, 
        "output": [],
        "args":   [], 
    };

    var include = null;
    var defaultExrFilePath = null;
    if (system.isWin) {
        // Windows
        cmdline.exec = path.join(system.getBinaryPath(), "win64", "vray", "vray.exe");
        include = path.join(system.getBinaryPath(), "win64", "vray");
        defaultExrFilePath = path.join(system.getBinaryPath(), "win64", "vray", "default.exr");
    } else {
        // Linux
        cmdline.exec = path.join(system.getBinaryPath(), "linux64", "vray", "vray");
        include = path.join(system.getBinaryPath(), "linux64", "vray");
        defaultExrFilePath = path.join(system.getBinaryPath(), "linux64", "vray", "default.exr");
    }

    cmdline.output = path.join(req.workspace, req.sessionId + "__" + req.workId + "." + configs.imageFormat);

    var x0 = req.subregion[0];
    var y0 = req.subregion[1];
    var x1 = req.subregion[0] + req.subregion[2];
    var y1 = req.subregion[1] + req.subregion[3];

    cmdline.args = [
        "-display=0", // disable render window
        "-sceneFile=" + req.renderFilePath,
        "-imgWidth=" + req.resolution[0],
        "-imgHeight=" + req.resolution[1],
        "-region=" + x0 + ";" + y0 + ";" + x1 + ";" + y1,
        "-crop=" + x0 + ";" + y0 + ";" + x1 + ";" + y1,
        "-include=" + include,
        "-showProgress=2",
        "-progressIncrement=5",
        "-parameterOverride=\"_SettingsEnvironment_Texture_BitmapBuffer.file=" + defaultExrFilePath + "\"",
        "-parameterOverride=\"_SettingsEnvironment_Texture1_BitmapBuffer.file=" + defaultExrFilePath + "\"",
        "-imgFile=" + cmdline.output];

    return cmdline;
};

myVRay.createConvertCommand = function(req) {
    var cmdline = {
        "exec":   null, 
        "args":   [], 
        "output": path.join(req.workspace, "main.vrscene")
    };

    cmdline.exec = path.join(system.getBinaryPath(), "win64", "vray", "mx_x64.vrscene.exe");

    cmdline.args = [
        path.join(req.workspace, "scene.json"),
        cmdline.output
    ];

    return cmdline;
};

myVRay.isSceneFile = function(file) {
    return path.extname(file) === ".vrscene";
};

myVRay.reportProgress = function(str) {
    var matched = str.match(/Rendering image...:\s+(\d+.\d+)%/);
    if (matched) {
        return matched[1];
    }
    return null;
};

module.exports = myVRay;
