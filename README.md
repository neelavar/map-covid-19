# CoVID-19 Impact Map

This project is to map the novel Corona Virus infections data and depict the global impact on the Google Maps.

For demo: [Demo deployment no longer active] - Please build and run locally.

## App Overview & Design Approach

The approach is kept simple:

1. Get the CoVID data from an API Endpoint
2. Store this data in Firebase RTDB
3. Create a Google Map instance
4. Leverage the CoVID Data and create overlays, using @deck.gl libraries

**Regular Updates:**

Instead of using the web client to call the API Endpoint, here the approach is to make the web client depend on the Firebase RTDB for data (there is a good reason for this). Use the _Cloud Functions_ to call the API Endpoint **every 3 hours** and update the data in RTDB.

**Why do we do this?**

On the map for every affected location, we need the following fields:

1. Latitude
2. Longitude
3. (optional) Country's Flag

This data is not available in the dataset from the API. Thus, the file `src/countries.json` has the list of all countries with their lat-lng and flag (emoji). Thanks to https://getemoji.com/

The `countries_stat` (covid data) from the API and the location data from the `countries` are combined to create the required `source_data` for the overlays on the Google Map.

## How to start?
Clone this repository and run `npm install`

## Get GMaps API Key
https://developers.google.com/maps/documentation/javascript/get-api-key

Update the `src/config.js` with the API Key.
For API Key restrictions, refer: https://cloud.google.com/docs/authentication/api-keys#api_key_restrictions

## CoVID-19 Data API `rapidapi.com`

Signup (FREE) and get the API Key to access the CoVID Data API.
https://rapidapi.com/astsiatsko/api/coronavirus-monitor

Update the `functions/src/api-key.ts`

## Setup Firebase Project

Signup/Login (Google ID) for Firebase and create a project.
Refer: https://firebase.google.com/docs/web/setup

After you setup the Firebae Project, get the Firebae Config and update `src/config.js`

Please install `firebase cli` to run any firebase commands. Refer: https://firebase.google.com/docs/cli

Ensure you've followed Firebase Project setup and have run `firebase init` command to setup the following:

1. Realtime Database
2. Cloud Functions
3. Hosting

Double check that your Hosting project is setup with a proper site name and ensure the same is updated in `firebase.json` file.

```
...
"hosting": {
    "site": "map-covid-19",
    "public": "public",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
...
```
In this example the site name is referred as `map-covid-19` - you can name whatever name you like during the hosting setup on Firebase Console.

### Realtime Database setup

The `countries` node should be setup with the data from `src/countries.json`. For this, run `npm run setup-countries` script. This will populate the RTDB at `/covid-19/countries` data node.

### Cloud Functions setup

On the terminal change to `functions` folder and do `npm install`

```
$ cd functions
$ npm install
...
```

## Deployment

**Build**

Run `npm run build` - webpack will build the project.

Deployment of this project is done in two steps:

1. Cloud Functions: Run `npm run deploy:functions` to deploy the cloud functions
2. Hosting: Run `npm run deploy:hosting` to deploy the cloud hosting

**Running locally**
If you wish to run the project locally, follow the steps:

1. Ensure the `countries` is setup on RTDB - refer to RTDB Setup above.
2. Deploy the cloud functions and let it start (check the console, to ensure the CoVID Data is updated)
3. Run `npm start` to start the local webpack dev server

>Note: If you've setup GMap [API Key restrictions](https://cloud.google.com/docs/authentication/api-keys#api_key_restrictions), ensure `localhost` is enabled.

## `deck.gl`

WebGL powered Data Visualization library. https://deck.gl/

## THANKS TO

1. **Jeff Delaney** (https://fireship.io) - He has created fantastic courses, tutorials, short videos, code snippets and special mention: https://fireship.io/lessons/deckgl-google-maps-tutorial/
2. **Marco Predari** for his inspiration to create this project. Link to Predo's project: https://covid19.marcopredari.it/
3. _@astsiatsko_ (https://rapidapi.com/user/astsiatsko) for providing the Data API for FREE


I wish the CoVID-19 spread stops soon and all the humanity settles down with normal life. I also take this moment to thank all the people who've been selflessly supporting, assisting, treating, managing the emergency support systems, healthcare facilities and also normal people like you and me who've quarantined themselves to be just safe.

@author: _Prasanna Neelavar_