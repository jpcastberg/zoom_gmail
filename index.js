const { gmail, zoom, mongodb } = require("./library");
const { configurations } = require("./configurations");

const dbConnection = mongodb.connection;
const newPassword = zoom.generatePassword();

resolveOnDbConnectionOpen()
    .then(() => {
        // return zoom.updateZoomMeeting({
        //     "password": newPassword
        // });

        return new Promise((resolve) => resolve());
    })
    .then(() => {
        return gmail.getEmailListAddresses(configurations.gmail.contactGroup);
    })
    .then((emailAddresses) => {
        return gmail.sendEmail({
            "isMailingList": true,
            "zoomPassword": newPassword,
            "bcc": emailAddresses,
        })
        .then(() => {
            return emailAddresses;
        })
    })
    .then(saveEmailAdressesToDb)
    .then(() => {
        return autoRespondForNMinutes(80);
    })
    .then(() => {
        console.log("done!!")
    })
    .catch((error) => {
        console.log(error)
    });

function autoRespondForNMinutes(minutes) {
    const now = new Date()
    const calculatedMinutes = minutes * 60 * 1000;
    const endTime = new Date(now.getTime() + calculatedMinutes);

    return new Promise((resolve) => {
        respondToUnhandledEmails();

        function respondToUnhandledEmails() {
            getHandledEmails()
                .then((handledEmails) => {
                    return gmail.getTodaysEmailAddresses()
                         .then((todaysEmailAddresses) => {
                            const unhandledEmails = todaysEmailAddresses.filter((emailAddress) => {
                                return handledEmails.indexOf(emailAddress) === -1;
                            });
        
                            return unhandledEmails;
                        });
                })
                .then((unhandledEmails) => {
                    if (unhandledEmails.length === 0) {
                        return new Promise((resolve) => resolve())
                    }

                    return gmail.sendEmail({
                        "isMailingList": false,
                        "zoomPassword": newPassword,
                        "bcc": unhandledEmails,
                    })
                    .then(() => {
                        return unhandledEmails;
                    });
                })
                .then(saveEmailAdressesToDb)
                .then(() => {
                    if (new Date() >= endTime) {
                        resolve();
                        return;
                    }

                    setTimeout(respondToUnhandledEmails, 30 * 1000);
                });
        }

        function getHandledEmails() {
            return mongodb.getSentEmailsForDay(new Date().toDateString());
        }
    });
}

function formatEmailAddressesForSave(emailAddresses = []) {
    return emailAddresses.map((emailAddress) => {
        const dateString = new Date().toDateString();
        return {
            "key": dateString + emailAddress,
            "emailAddress": emailAddress,
            "dateSent": dateString
        }
    });
}

function saveEmailAdressesToDb(emailAddresses) {
    const sentEmails = formatEmailAddressesForSave(emailAddresses);

    return mongodb.saveMany(sentEmails);
}

function resolveOnDbConnectionOpen() {
    return new Promise((resolve) => {
        dbConnection.once("open", () => {
            resolve();
        })
    });
}

