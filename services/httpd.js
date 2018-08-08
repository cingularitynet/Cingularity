// services/httpd.js
// a web server for development locally or converter unit test.
// 
// All rights reserved. Modelo, Inc xx - 2016
//


var bodyParser = require('body-parser');
var moment     = require("moment");
var express    = require('express');
var scheduler  = require('../scheduler');
var render     = require('../render');
var logger     = require('../utils/log');
var configs    = require("../global").config();
var global     = require("../global");

var app = express();
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({extended: true})); // for parsing application/x-www-form-urlencoded

var server = null;

var myHTTP = {
    start: null,
    stop: null,
    app: app,
    program: null,
    requests: 0
};

if (global.master) {
    myHTTP.program = scheduler;
} else {
    myHTTP.program = render;
}

const HTML = 
    "<html><head></head><body>" +
    "<form name=\"aform\" method=\"post\" action=\"/render\">" +
    "	<input type=\"text\" name=\"file\" value=\"C:\\tp\\modelo\\MODELO_renderserver\\samples\\simple\\scene.json\">" +
    "	<input type=\"hidden\" name=\"filepath\" value=\"C:\\tp\\modelo\\MODELO_renderserver\\samples\\simple\\scene.json\">" +
    "	<button name=\"submit\" onclick=\"submitform()\">render</button>" +
    "</form>" +
    "<script>" +
    "function submitform() {" +
    "	document.aform[1].value = document.aform[0].value;" +
    "	document.aform[0].value = null;" +
    "}" +
    "</script>" +
    "</body></html>";
    


myHTTP.start = function() {
    try {
        server = app.listen(configs.port, function(){
            logger.info(logger.HTTP, "HTTP server starts at port %d.", configs.port);

            app.get("/", function(req, res) {
                res.writeHead(200, {Connection: 'close'});
                res.end(HTML);
            });

            app.post("/render/", function(req, res) {
                if (!req.body.filepath) {
                    logger.error(logger.HTTP, "no filepath provided in http request");
                    throw "no file uploaded";
                }
                var filepath = (req.body.filepath? req.body.filepath : req.body.files[0]); 

                logger.info(logger.HTTP, "received session %s.", filepath);

                myHTTP.program.answerMock(filepath).then(function(res) {
                    logger.info(logger.HTTP, "#%d finish session %s.\n\n", res.ticket, res.filepath);

                    res.writeHead(500, {
                        'Content-Type': 'text/json'
                    });
                    res.end(JSON.stringify({
                        ticket: res.ticket,
                        msg: "succeeded",
                        file: res.filepath
                    }));
                }, function (err) {
                    res.writeHead(err.statusCode, {
                        'Content-Type': 'text/plain'
                    });
                    res.end(JSON.stringify({
                        code: err.code,
                        msg: err.msg
                    }));
                });
            });
        });
    } catch (err) {
        logger.error(err);
    }
};

myHTTP.stop = function() {
    if (server) {
        logger.info(logger.HTTP, "HTTP server stops.");

        server.close();
        server = null;
    }
};

module.exports = myHTTP;


