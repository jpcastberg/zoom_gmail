const ZOOM_MEETING_ID = "776206300";

module.exports = {
    "zoom": {
        "meetingId": ZOOM_MEETING_ID
    },
    "gmail": {
        "contactGroup": "46030860b726dd1",
        "emailSubject": "test_email_subject",
        "getMessage": function (zoomPassword, meetingTime) {
            return `TODAY'S MEETING PASSWORD IS: ${zoomPassword}

            Today's meeting will be held at ${meetingTime} pacific time.
            
            Meeting tip: To ensure anonymity at AA Zoom meetings, we recommend that you do not use your full name as your display name. For more tips on preserving anonymity at meetings, please visit: https://aasfmarin.org/maintain-anonymity-online-zoom-meeting
            
            To join:
            
            By web:
            https://us04web.zoom.us/j/${ZOOM_MEETING_ID}
            
            OR
            
            Dial by your location
            (669) 900-6833
            Meeting ID: ${ZOOM_MEETING_ID}
            
            You received this email because you are subscribed to receive our meeting password daily. To stop receiving the meeting password, please reply "STOP", and we will remove you from the list.`;
        }
    }
};
