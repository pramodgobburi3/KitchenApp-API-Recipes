const axios = require('axios');
const {pub: redis_client} = require('../redis_client');
const config = require('../config/config.js');
const qs = require('qs');
const mongoose = require('mongoose');

getAccessToken = async function() {
  try {
    let krogerAccessToken = await redis_client.get('kroger_access_token');
    if (krogerAccessToken) {
      let tokenExpiry = await redis_client.get('kroger_access_token_expiry');
      console.log('tokenExpiry', parseFloat(tokenExpiry));
      if (tokenExpiry) {
        let timeThreshold = Date.now() + 120000;
        if(parseFloat(tokenExpiry) < timeThreshold) {
          // Token expired
          let token = createAccessToken();
          return token;
        } else {
          return krogerAccessToken;
        }
      }
    }
    let token = await createAccessToken();
    return token;
  } catch (error) {
    throw error;
  }
}

createAccessToken = async function() {
  let clientId = config.kroger.clientId || 'kitchenapp-851872fe8d8cb97a812ce31e03cb0f0c4437257229801038673';
  let clientSecret = config.kroger.clientSecret || 'HQr7hdLOnRjFfryPxyCGxEO1KHEgMrjFe5r9RBZ7';
  let bufferToken = clientId + ':' + clientSecret;
  let clientToken = 'Basic ' + Buffer.from(bufferToken).toString('base64');
  console.log('clientToken', clientToken);
  try {
    let resp = await axios({
      url: 'https://api.kroger.com/v1/connect/oauth2/token',
      method: 'POST',
      headers: {'Authorization': clientToken, 'Content-Type': 'application/x-www-form-urlencoded'},
      data: qs.stringify({
        'grant_type': 'client_credentials',
        'scope': 'product.compact'
      })
    });
    let accessToken = resp.data.access_token;
    let expires_in = resp.data.expires_in;
    let expiry = Date.now() + (expires_in * 1000);
    redis_client.set('kroger_access_token', accessToken);
    redis_client.set('kroger_access_token_expiry', expiry);
    return accessToken;
  } catch (e) {
    throw e;
  }
}

searchProductsByTerm = async function(term, locationId) {
  try {
    let accessToken = await getAccessToken();
    let resp = await axios({
      url: 'https://api.kroger.com/v1/products',
      method: 'GET',
      params: {
        'filter.term': term,
        'filter.locationId': locationId
      },
      headers: {'Authorization': 'Bearer ' + accessToken}
    });
    return resp.data;
  } catch (e) {
    throw e;
  }
}

searchLocationsByLatLng = async function(lat, lng) {
  try {
    let storedLocations = await mongoose.model('krogerlocations').aggregate([
      { "$geoNear": {
          "near": {
            "type": "Point",
            "coordinates": [lng, lat]
          },
          "distanceField": "distance",
          "spherical": true,
          "maxDistance": (10 * 1609.34) //10 miles to meters
      }}
    ]);
    // let storedLocations = [];
    if (storedLocations.length > 0) {
      return storedLocations;
    } else {
      console.log('fetching data');
      let latLng = `${lat},${lng}`
      let accessToken = await getAccessToken();
      let resp = await axios({
        url: 'https://api.kroger.com/v1/locations',
        method: 'GET',
        params: {
          'filter.latLong.near': latLng,
          'filter.chain': 'Kroger'
        },
        headers: {'Authorization': 'Bearer ' + accessToken}
      });
      let locations = resp.data.data;
      let insert_docs = [];
      locations.map(location => {
        insert_docs.push({
          "location_id": location.locationId,
          "name": location.name,
          "latLng": {
            "type": "Point",
            "coordinates": [location.geolocation.longitude, location.geolocation.latitude]
          },
          "address": location.address.addressLine1,
          "address2": location.address.addressLine2,
          "city": location.address.city,
          "state": location.address.state,
          "county": location.address.county,
          "zipCode": location.address.zipCode
        })
      });
      await mongoose.model('krogerlocations').insertMany(insert_docs);
      let storedLocations = await mongoose.model('krogerlocations').aggregate([
        { "$geoNear": {
            "near": {
              "type": "Point",
              "coordinates": [lng, lat]
            },
            "distanceField": "distance",
            "spherical": true,
            "maxDistance": (10 * 1609.34) //10 miles to meters
        }}
      ]);
      return storedLocations;
    }
  } catch (e) {
    throw e;
  }
}

module.exports = {
  getAccessToken,
  createAccessToken,
  searchProductsByTerm,
  searchLocationsByLatLng
};
