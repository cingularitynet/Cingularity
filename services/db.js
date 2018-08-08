// services/db.js
// The wrapper of database
// 
// All rights reserved. Modelo, Inc xx - 2016
//


var global = require("../global");
var system = require("../utils/system");
var path   = require("path");
var fs     = require("fs");

var myDB = {};

// Now we simply write/read the a DB file in the workspace of the session.

myDB.write = function(id, object) {
    var dbFilepath = path.join(system.getWorkspaceRoot(), id, "db.dat");
    var str = JSON.stringify(object);
    fs.writeFileSync(dbFilepath, str, "utf8");
};

myDB.read = function(id) {
    var dbFilepath = path.join(system.getWorkspaceRoot(), id, "db.dat");
    if (fs.existsSync(dbFilepath)) {
        var str = fs.readFileSync(dbFilepath, "utf8");
        return JSON.parse(str);
    }

    return null;
};


module.exports = myDB;
