const { gmail, zoom } = require("./library");
const { configurations } = require("./configurations");

const newPassword = zoom.generatePassword();

zoom.updateZoomMeeting({
    "password": newPassword
})
    .then(() => gmail.getEmailAddresses(configurations.gmail.contactGroup))
    .then((emailAddresses) => gmail.sendEmail({
        "bcc": emailAddresses,
        "subject": configurations.gmail.emailSubject,
        "message": configurations.gmail.getMessage(newPassword, "2am")
    }))
    .then((info) => {
        debugger;
    })
    .catch((error) => {
        debugger;
    });

