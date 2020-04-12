const nodemailer = require("nodemailer");
const { "google": googleApis } = require("googleapis");
const { credentials, configurations } = require("../configurations");
const { oauth2Provider } = require("./credentials.js");

const { "gmail": gmailCredentials } = credentials;
const { people, contactGroups } = googleApis.people({
    "version": "v1",
    "auth": oauth2Provider
});

function sendEmail(options) {
    const transport = getTransport(gmailCredentials);
    var message = {
        "from": gmailCredentials.user,
        "bcc": options.bcc,
        "subject": options.subject,
        "text": options.message
    };

    return new Promise((resolve, reject) => {
        transport.sendMail(message, (error, info) => {
            if (error) {
                reject(error);
            }

            resolve(info);
        });
    });
}

function getEmailAddresses() {
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

function getTransport(emailCredentials) {
    return nodemailer.createTransport({
        "host": "smtp.gmail.com",
        "port": 465,
        "secure": true,
        "auth": {
            "type": "OAuth2",
            "user": emailCredentials.user,
            "clientId": emailCredentials.client_id,
            "clientSecret": emailCredentials.client_secret,
            "refreshToken": emailCredentials.tokens.refresh_token,
            "accessToken": emailCredentials.tokens.access_token,
            "expires": emailCredentials.tokens.expiry_date
        }
    });
}

module.exports = {
    "getEmailAddresses": getEmailAddresses,
    "sendEmail": sendEmail
};
