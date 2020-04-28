const { gmail, zoom, mongodb } = require("./library");
const { configurations } = require("./configurations");

const dbConnection = mongodb.connection;
const zoomPassword = zoom.generatePassword();
const dryRun = true;

resolveOnDbConnectionOpen()
    .then(() => {
        if (dryRun) {
            return new Promise((resolve) => resolve());
        }

        return zoom.updateZoomMeeting({
            "password": zoomPassword
        });

    })
    .then(() => {
        return gmail.getEmailListAddresses(configurations.gmail.contactGroup);
    })
    .then((emailAddresses) => {
        return gmail.sendEmail({
            "isMailingList": true,
            "zoomPassword": zoomPassword,
            "bcc": emailAddresses,
            "dryRun": dryRun
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

function autoRespondForNMinutes(minutes = 80) {
    const now = new Date()
    const calculatedMinutes = minutes * 60 * 1000;
    const endTime = new Date(now.getTime() + calculatedMinutes);

    return new Promise((resolve) => {
        respondToUnhandledEmails();

        function respondToUnhandledEmails() {
            console.log("respondToUnhandledEmails triggered");
            getHandledEmails()
                .then((handledEmails) => {
                    return gmail.getTodaysEmailAddresses()
                         .then((todaysEmailAddresses) => {
                            const unhandledEmails = todaysEmailAddresses.filter((emailAddress) => {
                                const extractedEmailAddress = extractEmailAddress(emailAddress);
                                return handledEmails.indexOf(extractedEmailAddress) > 0;
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
                        "zoomPassword": zoomPassword,
                        "bcc": unhandledEmails,
                        "dryRun": dryRun
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

                    setTimeout(respondToUnhandledEmails, 10 * 1000);
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
        const extractedEmailAddress = extractEmailAddress(emailAddress);
        return {
            "key": dateString + extractedEmailAddress,
            "emailAddress": extractedEmailAddress,
            "dateSent": dateString
        }
    });
}

function extractEmailAddress(emailAddress = "") {
    return emailAddress.replace(/^.*<(.+)>.*$/g, "$1")
}

function saveEmailAdressesToDb(emailAddresses = []) {
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

