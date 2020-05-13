import 'firebase/analytics';
import 'firebase/database';
import 'firebase/auth';

import { GoogleMapsOverlay } from '@deck.gl/google-maps';
import * as firebase from 'firebase/app';

import { firebaseConfig, GMAP_API_KEY } from './config';
import { darkModeMapStyle } from './dark-mode-map-style';
import { heatmap, scatterplot } from './map-util';

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
firebase.analytics();
firebase.auth().signInAnonymously();

const db = firebase.database();
let date = new Date().toISOString().substring(0, 10);
let uid = null;

// Locations to pan & zoom into on click of a button
const locationData = {
  as: { lat: 23, lng: 82, zoom: 4 },
  au: { lat: -25, lng: 133, zoom: 5 },
  eu: { lat: 45, lng: 10, zoom: 5 },
  na: { lat: 42, lng: -95, zoom: 4 },
  me: { lat: 30, lng: 50, zoom: 5 },
  sa: { lat: -22, lng: -80, zoom: 4 },
};

// Combine CoVID data countries_stat with the lat,lng and flag
const getMappedCountries = (countries_stat, countries) => {
  const sourceData = [];
  countries_stat.forEach((country) => {
    const cf = countries.find((co) => co.name.toLowerCase() === country.country_name.toLowerCase());
    if (cf) {
      const longitude = cf.long;
      const latitude = cf.lat;
      const flag = cf.flag;
      const cases = Number(country.cases.replace(/,/g, ''));
      const deaths = Number(country.deaths.replace(/,/g, ''));
      const active_cases = Number(country.active_cases.replace(/,/g, ''));
      const new_cases = Number(country.new_cases.replace(/,/g, ''));
      const new_deaths = Number(country.new_deaths.replace(/,/g, ''));
      const total_recovered = Number(country.total_recovered.replace(/,/g, ''));
      const serious_critical = Number(country.serious_critical.replace(/,/g, ''));
      const dpm = Number(country.deaths_per_1m_population.replace(/,/g, ''));
      const tpm = Number(country.tests_per_1m_population.replace(/,/g, ''));
      const tcmp = Number(country.total_cases_per_1m_population.replace(/,/g, ''));
      // console.log({ total_recovered, country_tr: country.total_recovered });
      sourceData.push({
        ...country,
        cases: isNaN(cases) ? 0 : cases,
        deaths: isNaN(deaths) ? 0 : deaths,
        total_recovered: isNaN(total_recovered) ? 0 : total_recovered,
        serious_critical: isNaN(serious_critical) ? 0 : serious_critical,
        active_cases: isNaN(active_cases) ? 0 : active_cases,
        new_cases: isNaN(new_cases) ? 0 : new_cases,
        new_deaths: isNaN(new_deaths) ? 0 : new_deaths,
        dpm: isNaN(dpm) ? 0 : dpm,
        tpm: isNaN(tpm) ? 0 : tpm,
        tcmp: isNaN(tcmp) ? 0 : tcmp,
        longitude,
        latitude,
        flag,
      });
    }
  });
  return sourceData;
};

const setupTotals = (sourceData) => {
  const totalCases = document.getElementById('total-cases');
  const recoveries = document.getElementById('recoveries');
  const fatalities = document.getElementById('fatalities');

  let tc = 0;
  let rc = 0;
  let ft = 0;
  sourceData.forEach((d) => {
    tc += Number(d.cases);
    rc += Number(d.total_recovered);
    ft += Number(d.deaths);
  });
  totalCases.innerHTML = `<b>${tc.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')}</b>`;
  recoveries.innerHTML = `<b>${rc.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')}</b>`;
  fatalities.innerHTML = `<b>${ft.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')}</b>`;
};

// Load the CoVID data from firebase RTDB
const loadCovidData = (callback) => {
  if (!uid) {
    return callback([]);
  }
  return db
    .ref('/covid-19')
    .once('value')
    .then((snap) => {
      const covid = snap.val();
      const countries = covid.countries;
      const countries_stat = covid.countries_stat;
      const sourceData = getMappedCountries(countries_stat, countries);
      date = covid.statistic_taken_at.substring(0, 10);
      document.getElementById('updated').innerHTML = `Last Update: ${new Date(date).toLocaleDateString()}`;
      setupTotals(sourceData);
      callback(sourceData);
    });
};

// On page load, get the GMaps Script & set callback
window.onload = () => {
  const origin = location.hostname;
  // console.log({ location });
  if (origin !== 'map-covid-19.web.app') {
    confirm('Thank you for your interest. \nPlease visit https://map-covid-19.web.app');
  } else {
    const gMapScript = document.createElement('script');
    gMapScript.src = `https://maps.googleapis.com/maps/api/js?key=${GMAP_API_KEY}&callback=initMap`;
    firebase.auth().onAuthStateChanged((user) => {
      if (user) {
        uid = user.uid;
        document.head.appendChild(gMapScript);
      } else {
        uid = null;
      }
    });
  }
};

// callback once the gmaps script is loaded
window.initMap = () => {
  // define the dark mode map
  const darkModeMap = new google.maps.StyledMapType(darkModeMapStyle, { name: 'CoVID-19 Impact' });
  const map = new google.maps.Map(document.getElementById('map'), {
    center: { lat: 23.0, lng: 0 },
    zoom: 3,
    gestureHandling: 'greedy',
    disableDefaultUI: true,
    mapTypeControlOptions: {
      mapTypeIds: ['roadmap', 'dark_mode_map'],
    },
  });

  map.mapTypes.set('dark_mode_map', darkModeMap);
  map.setMapTypeId('dark_mode_map');

  // Now load the CoVID data and setup the overlay layers
  loadCovidData((src) => {
    // console.log({ src });
    if (src) {
      const overlay = new GoogleMapsOverlay({
        layers: [heatmap(src), scatterplot(src)],
      });

      overlay.setMap(map);

      // For every location buttons, set click event listeners
      Object.keys(locationData).forEach((key) => {
        const btn = document.getElementById(key);
        google.maps.event.addDomListener(btn, 'click', () => {
          // first zoom out a bit
          map.setZoom(3);
          const { lat, lng, zoom } = locationData[key];
          setTimeout(() => {
            // now pan to the location center
            map.panTo({ lat, lng });
            // now zoom back
            map.setZoom(zoom);
          }, 1000); // a sec delay makes the zoom out -> pan -> zoom back smoother
        });
      });
    }
  });
};
