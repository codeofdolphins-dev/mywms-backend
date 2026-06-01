import cron from "node-cron";
import { rfqExpiryWorker } from "./workers/rfqExpiry.worker.js";
import { logWritter } from "../helper/logWritter.js";

const cronTime = {
    rfqExpiry: "0 0 * * *"
}

export function rfqExpiryJob() {
    console.log("🔔 RFQ Expiry Job initialized...");

    // 1. RFQ Expiry Job
    cron.schedule(cronTime.rfqExpiry, async () => {
        const startText = `⏳ [Cron]: Running RFQ Expiry at ${new Date()}`
        const endText = `✅ [Cron]: RFQ Expiry completed at ${new Date()}`
        const errorText = `❌ [Cron]: RFQ Expiry failed at ${new Date()}:`

        try {
            console.log(startText);
            logWritter("./cron.log", startText)

            await rfqExpiryWorker();

            console.log(endText);
            logWritter("./cron.log", endText)

        } catch (error) {
            console.error(errorText, error);
            logWritter("./cron.log", errorText + error)
        }
    });
}