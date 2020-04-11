const axios = require("axios");
const credentials = require("./credentials.json");
const jwt = require("jsonwebtoken");

axios.defaults.headers.patch["Content-Type"] = "application/json";

const endpoints = {
    "zoom": {
        "BASE_API": "https://api.zoom.us/v2/"
    }
};

const zoomApi = axios.create({
    "baseURL": endpoints.zoom.BASE_API,
    "transformRequest": [(data, headers) => {
        const payload = {
            "iss": credentials.zoom.apiKey,
            "exp": ((new Date()).getTime() + 5000)
        };

        const token = jwt.sign(payload, credentials.zoom.apiSecret, {
            "header": credentials.zoom.header
        });

        headers.common.Authorization = "Bearer " + token;

        return JSON.stringify(data);
    }]
});

module.exports = {
    "zoomApi": zoomApi
};

