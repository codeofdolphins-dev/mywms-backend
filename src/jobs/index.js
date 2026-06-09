import { rfqExpiryJob } from "./schedules.js";

const cronTime = {
    rfqExpiry: "0 0 * * *"
};



export function initSchedule() {
    rfqExpiryJob(cronTime.rfqExpiry);
};