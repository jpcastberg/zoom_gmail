const configuration = require("./configuration");
const { endpoints, credentials } = configuration;
const zoomApi = endpoints.zoomApi;

const newPassword = generatePassword();

updateZoomMeeting({
    "password": newPassword
}, credentials.zoom.meetingId)
    .then();

function updateZoomMeeting(newData, meetingId) {
    return zoomApi.patch("/meetings/" + meetingId, newData);
    
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
