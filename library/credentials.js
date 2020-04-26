const fs = require("fs");
const { "google": googleApis } = require("googleapis");
const xoauth2 = require("xoauth2");
const { credentials } = require("../configurations");

const xoauth2Generator = xoauth2.createXOAuth2Generator({
    "user": credentials.gmail.user,
    "clientId": credentials.gmail.client_id,
    "clientSecret": credentials.gmail.client_secret,
    "refreshToken": credentials.gmail.refresh_token
});

function updateCredentials(newCredentials) {
    return new Promise((resolve, reject) => {
        fs.writeFile(
            "../configuration/credentials.json",
            JSON.stringify(newCredentials, null, 4),
            (error) => {
                if (error) {
                    return reject(error);
                }

                resolve();
            }
        );
    });
}

function getOauth2Provider(credentials) {
    const newOauth2Provider = new googleApis.auth.OAuth2(
        credentials.client_id,
        credentials.client_secret,
        credentials.redirect_uris[0]
    );
    
    // contactGroups/421324f8d4c813b
    newOauth2Provider.setCredentials(credentials.tokens);
    
    newOauth2Provider.on("tokens", (tokens) => {
        const ttlInSeconds = Math.round((tokens.expiry_date - new Date().getTime()) / 1000);
        if (tokens.refresh_token) {
            newOauth2Provider.setCredentials(tokens);
            xoauth2Generator.updateToken(tokens, ttlInSeconds);
            credentials.gmail.tokens = tokens;
            updateCredentials(credentials)
                .catch((error) => {
                    throw error;
                });
        }
    });

    return newOauth2Provider;
}

module.exports = {
    "oauth2Provider": getOauth2Provider(credentials.gmail),
    "xoauth2Generator": xoauth2Generator
};
