const ZOOM_MEETING_ID = "229464399";
const EMAIL_HEADINGS = {
    "sunday": "Sunday - Experience, Strength, and Hope",
    "monday": "Monday - Meditation",
    "tuesday": "Tuesday - Living Sober Book Study",
    "wednesday": "Wednesday - Meditation",
    "thursday": "Thursday - Speaker/Discussion",
    "friday": "Friday - Step Study",
    "saturday": "Saturday - Daily Reflections Book Study",
};

module.exports = {
    "zoom": {
        "meetingId": ZOOM_MEETING_ID
    },
    "gmail": {
        "contactGroup": "421324f8d4c813b",
    },
    "template": {
        "previewText": "We are looking forward to seeing you!",
        "subject": "Anything is Possible Meeting Password",
        "getEmailHeading": function () {
            return EMAIL_HEADINGS[
                getDayByNumber(new Date().getDay())
            ]
        },
        "getMeetingTime": function () {
            switch (new Date().getDay()) {
                case 0: return "1pm";
                case 6: return "11am";
                default: return "5pm";
            }
        }
    }
};

function getDayByNumber(number) {
    return [
        "sunday",
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday"
    ][number];
}
