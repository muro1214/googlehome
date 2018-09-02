// require
const express = require("express");
const bodyParser = require('body-parser');

// REST api
const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

var router = require("./api/v1/");
app.use("/api/v1/", router);

// starte REST
app.listen(3000);
console.log("listen on port 3000");
