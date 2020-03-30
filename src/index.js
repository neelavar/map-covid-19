import 'firebase/analytics';
import 'firebase/database';

import { GoogleMapsOverlay } from '@deck.gl/google-maps';
import * as firebase from 'firebase/app';

import { firebaseConfig, GMAP_API_KEY } from './config';
import { darkModeMapStyle } from './dark-mode-map-style';
import { heatmap, scatterplot } from './map-util';

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
firebase.analytics();

const db = firebase.database();
let date = new Date().toISOString().substring(0, 10);

// Locations to pan & zoom into on click of a button
const location = {
  as: { lat: 23, lng: 82, zoom: 4 },
  au: { lat: -25, lng: 133, zoom: 5 },
  eu: { lat: 45, lng: 10, zoom: 5 },
  na: { lat: 42, lng: -95, zoom: 4 },
  me: { lat: 30, lng: 50, zoom: 5 },
  sa: { lat: -22, lng: -80, zoom: 4 }
};

// Combine CoVID data countries_stat with the lat,lng and flag
const getMappedCountries = (countries_stat, countries) => {
  const sourceData = [];
  countries_stat.forEach(country => {
    const cf = countries.find(co => co.name.toLowerCase() === country.country_name.toLowerCase());
    if (cf) {
      const longitude = cf.long;
      const latitude = cf.lat;
      const flag = cf.flag;
      const cases = Number(country.cases.replace(',', ''));
      const deaths = Number(country.deaths.replace(',', ''));
      const active_cases = Number(country.active_cases.replace(',', ''));
      const new_cases = Number(country.new_cases.replace(',', ''));
      const total_recovered = Number(country.total_recovered.replace(',', ''));
      const serious_critical = Number(country.serious_critical.replace(',', ''));
      sourceData.push({
        ...country,
        cases,
        deaths,
        total_recovered,
        serious_critical,
        active_cases,
        new_cases,
        longitude,
        latitude,
        flag
      });
    }
  });
  return sourceData;
};

const setupTotals = sourceData => {
  const totalCases = document.getElementById('total-cases');
  const recoveries = document.getElementById('recoveries');
  const fatalities = document.getElementById('fatalities');

  let tc = 0;
  let rc = 0;
  let ft = 0;
  sourceData.forEach(d => {
    tc += d.cases;
    rc += d.total_recovered;
    ft += d.deaths;
  });
  totalCases.innerHTML = `<b>${tc.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</b>`;
  recoveries.innerHTML = `<b>${rc.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</b>`;
  fatalities.innerHTML = `<b>${ft.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</b>`;
};

// Load the CoVID data from firebase RTDB
const loadCovidData = callback => {
  return db
    .ref('/covid-19')
    .once('value')
    .then(snap => {
      const covid = snap.val();
      const countries = covid.countries;
      const countries_stat = covid.countries_stat;
      const sourceData = getMappedCountries(countries_stat, countries);
      date = covid.statistic_taken_at.substring(0, 10);
      // document.title = `CoVID-19 | Updated ${date}`;
      document.getElementById('updated').innerHTML = `Last Update: ${new Date(date).toLocaleDateString()}`;
      // console.log({ sourceData });
      setupTotals(sourceData);
      callback(sourceData);
    });
};

// On page load, get the GMaps Script & set callback
window.onload = () => {
  const gMapScript = document.createElement('script');
  gMapScript.src = `https://maps.googleapis.com/maps/api/js?key=${GMAP_API_KEY}&callback=initMap`;
  document.head.appendChild(gMapScript);
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
      mapTypeIds: ['roadmap', 'dark_mode_map']
    }
  });

  map.mapTypes.set('dark_mode_map', darkModeMap);
  map.setMapTypeId('dark_mode_map');

  // Now load the CoVID data and setup the overlay layers
  loadCovidData(src => {
    // console.log({ src });
    if (src) {
      const overlay = new GoogleMapsOverlay({
        layers: [heatmap(src), scatterplot(src)]
      });

      overlay.setMap(map);

      // For every location buttons, set click event listeners
      Object.keys(location).forEach(key => {
        const btn = document.getElementById(key);
        google.maps.event.addDomListener(btn, 'click', () => {
          // first zoom out a bit
          map.setZoom(3);
          const { lat, lng, zoom } = location[key];
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
