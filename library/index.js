const credentials = require("./credentials.js");
const gmail = require("./gmail.js");
const zoom = require("./zoom.js");
const mongodb = require("./mongodb.js");

module.exports = {
    "credentials": credentials,
    "gmail": gmail,
    "mongodb": mongodb,
    "zoom": zoom
};
