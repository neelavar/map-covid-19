import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
admin.initializeApp();

functions.runWith({ memory: "128MB" });
import * as cron from "./cron-update-covid-data";

// cloud-function is exported as covidUpdater
export const covidUpdater = cron.dataUpdater;
