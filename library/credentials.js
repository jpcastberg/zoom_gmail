const fs = require("fs");
const { "google": googleApis } = require("googleapis");
const { credentials } = require("../configurations");

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
        if (tokens.refresh_token) {
            newOauth2Provider.setCredentials(tokens);
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
    "oauth2Provider": getOauth2Provider(credentials.gmail)
};
