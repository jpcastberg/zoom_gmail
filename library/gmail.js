const Imap = require("imap");
const sgMail = require("@sendgrid/mail");
const { "google": googleApis } = require("googleapis");
const { credentials, configurations } = require("../configurations");
const { oauth2Provider } = require("./credentials.js");

const { "gmail": gmailCredentials } = credentials;
const { people, contactGroups } = googleApis.people({
    "version": "v1",
    "auth": oauth2Provider
});

sgMail.setApiKey(credentials.sendgrid.apiKey);

const imap = new Imap({
    "user": gmailCredentials.user,
    "password": gmailCredentials.password,
    "host": "imap.gmail.com",
    "port": 993,
    "tls": true,
    "tlsOptions": {
        "servername": "imap.gmail.com"
    }
});

function getTodaysEmailAddresses() {
    imap.once("error", function (err) {
        console.log(err);
    });
           
    imap.once("end", function () {
        console.log("Connection ended");
    });
           
    imap.connect();

    return resolveOnImapReady()
        .then(() => {
            return openInbox();
        })
        .then(() => {
            return getTodaysEmailUids();
        })
        .then((uids) => {
            return fetchTodaysEmailAddresses(uids);
        })
        .then((emailAddresses) => {
            return emailAddresses;
        });

    function resolveOnImapReady() {
        return new Promise((resolve) => {
            imap.once("ready", resolve);
        });
    }

    function openInbox() {
        return new Promise((resolve, reject) => {
            imap.openBox("INBOX", true, (error, box) => {
                if (error) {
                    reject(error);
                    return;
                }
    
                resolve(box);
            });
        });
    }

    function getTodaysEmailUids() {
        return new Promise((resolve, reject) => {
            imap.seq.search(["ALL",["SINCE", new Date()]], function (error, uids) {
                if (error) {
                    reject(error);
                    return;
                }

                resolve(uids);
            });
        });
    }

    function fetchTodaysEmailAddresses(uids) {
        return new Promise((resolve, reject) => {
            const unansweredAddresses = [];
            const fetch = imap.seq.fetch(uids, {
                "bodies": [
                    "HEADER.FIELDS (FROM X-GM-LABELS)"
                ]
            });

            fetch.on("message", function (msg, seqno) {
                msg.on("body", function (stream, info) {
                    var buffer = "";
        
                    stream.on("data", function (chunk) {
                        buffer += chunk.toString("utf8");
                    });

                    stream.once("end", function () {
                        const parsedHeader = Imap.parseHeader(buffer);

                        if (parsedHeader.from && parsedHeader.from[0]) {
                            unansweredAddresses.push(parsedHeader.from[0]);
                        }
                    });
                });
            });
        
            fetch.once("error", function (error) {
                reject(error);
            });
        
            fetch.once("end", function () {
                resolve(unansweredAddresses);
                imap.end();
            });
        });
    }
}

function sendEmail(options) {
    const msg = {
        "from": gmailCredentials.user,
        "to": gmailCredentials.user,
        "bcc": options.bcc,
        "templateId": "d-a9cb08016f304c828aa1f498510b47af",
        "subject": configurations.template.subject,
        "dynamicTemplateData": {
            "previewText": configurations.template.previewText,
            "subject": configurations.template.subject,
            "isMailingList": options.isMailingList,
            "zoomPassword": options.zoomPassword,
            "zoomMeetingId": configurations.zoom.meetingId,
            "meetingTime": configurations.template.getMeetingTime(),
            "heading": configurations.template.getEmailHeading()
        }
    };

    return new Promise((resolve) => {
        console.log("sendEmail would send message: " + JSON.stringify(msg, null, 4));

        resolve();
    })

    // console.log("sending test email")
    // return sgMail.send(msg);
}

function getEmailListAddresses() {
    return contactGroups.get({
        "resourceName": "contactGroups/" + configurations.gmail.contactGroup, // "contactGroups/421324f8d4c813b", <- actual contact group
        "maxMembers": 100000
    })
        .then(({ "data": { memberResourceNames } }) => {
            const promises = [];

            while (memberResourceNames.length) {
                const queuedResourceNames = memberResourceNames
                    .splice(0, Math.min(50, memberResourceNames.length));

                promises.push(people.getBatchGet({
                    "resourceNames": queuedResourceNames,
                    "personFields": "emailAddresses"
                }));
            }
    
            return Promise.all(promises);
        })
        .then((responses) => {
            const people = getPeople(responses);
            const emailAddresses = getEmailAddresses(people);

            return emailAddresses;

            function getPeople(responses) {
                return responses.reduce((accumulator, response) => {
                    const { "data": { "responses": people } } = response;

                    return accumulator.concat(people);
                }, []);
            }

            function getEmailAddresses(people) {
                const emailAddresses = people.reduce((accumulator, { "person": { emailAddresses } }) => {
                    if (emailAddresses) {
                        return accumulator.concat(emailAddresses.map((emailAddress) => {
                            return emailAddress.value;
                        }));
                    }

                    return accumulator;
                }, []);

                return emailAddresses;
            }
        });
}

module.exports = {
    "getEmailListAddresses": getEmailListAddresses,
    "getTodaysEmailAddresses": getTodaysEmailAddresses,
    "sendEmail": sendEmail
};
