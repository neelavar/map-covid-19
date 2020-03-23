// src/cron-update-covid-data.ts
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

import { API_KEY } from "./api-key";
const axios = require("axios");

/**
 * This is a scheduled cloud function trigger
 * This will run once in every 4 hours
 * On invocation, this function will fetch the covid data from the API
 * and update the /covid-19 data node in RTDB
 */

const covidPath = "/covid-19";

const options = {
  method: "GET",
  url:
    "https://coronavirus-monitor.p.rapidapi.com/coronavirus/cases_by_country.php",
  headers: {
    "content-type": "application/octet-stream",
    "x-rapidapi-host": "coronavirus-monitor.p.rapidapi.com",
    "x-rapidapi-key": API_KEY
  }
};

export const dataUpdater = functions.pubsub
  .schedule("every 3 hours")
  .onRun(async context => {
    // Use AXIOS to call the RAPID API to get covid data
    const response = await axios(options);
    // update the latest covidData to RTDB
    // console.log("response DATA:", response.data);
    if (response.status === 200 && response.data) {
      const covidData = response.data;
      console.log(`CoVID data updated: ${context.timestamp}`);
      return admin
        .database()
        .ref(covidPath)
        .update(covidData);
    } else return;
  });
