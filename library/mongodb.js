const mongoose = require("mongoose");
const connection = mongoose.connection;
const { "credentials": { "mLab": mLabCredentails } } = require("../configurations");
const sentEmailSchema = new mongoose.Schema({
    "key": {
        type: String,
        unique: true
    },
    "emailAddress": String,
    "dateSent": String
});
const SentEmailModel = mongoose.model("SentEmailModel", sentEmailSchema);

mongoose.connect(
    `mongodb://${mLabCredentails.username}:${mLabCredentails.password}@ds221095.mlab.com:21095/anythingispossible`, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    });

function getSentEmailsForDay(dateSent) {
    return new Promise((resolve, reject) => {
        SentEmailModel.find({
            "dateSent": dateSent
        }, (error, todaysSentEmails) => {
            if (error) {
                reject(error);
                return;
            }

            const formattedEmailList =
                formatEmailAddressesFromDb(todaysSentEmails)

            resolve(formattedEmailList);
        })
    });
}

function saveMany(documents) {
    return SentEmailModel.create(documents)
        .catch(handleDupeKey);
}

function handleDupeKey() {
    return new Promise((resolve) => resolve())
}

function formatEmailAddressesFromDb(emailAddressDocuments) {
    return emailAddressDocuments.map((emailAddressDocument) => {
        return emailAddressDocument.emailAddress;
    });
}

module.exports = {
    "connection": connection,
    "getSentEmailsForDay": getSentEmailsForDay,
    "saveMany": saveMany
};
