const axios = require("axios");
const jwt = require("jsonwebtoken");

const { credentials, configurations } = require("../configurations");
const { "zoom": zoomCredentials } = credentials;

axios.defaults.headers.patch["Content-Type"] = "application/json";

const ZOOM_BASE_ENDPOINT = "https://api.zoom.us/v2/";

const zoom = axios.create({
    "baseURL": ZOOM_BASE_ENDPOINT,
    "transformRequest": [(data, headers) => {
        const payload = {
            "iss": zoomCredentials.apiKey,
            "exp": ((new Date()).getTime() + 5000)
        };

        const token = jwt.sign(payload, zoomCredentials.apiSecret, {
            "header": zoomCredentials.header
        });

        headers.common.Authorization = "Bearer " + token;

        return JSON.stringify(data);
    }]
});

function updateZoomMeeting(newData) {
    return zoom.patch("/meetings/" + configurations.zoom.meetingId, newData);   
}

function generatePassword() {
    let password = "";

    while (password.length < 6) {
        password += getRandomSingleDigitInt();
    }

    return password;

    function getRandomSingleDigitInt() {
        return Math.floor(Math.random() * (9 - 0 + 1)) + 0;
    }
}

module.exports = {
    "generatePassword": generatePassword,
    "updateZoomMeeting": updateZoomMeeting
};
