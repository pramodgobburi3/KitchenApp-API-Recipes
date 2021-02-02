var config = require('../config/config.js');
const AWS = require('aws-sdk');

var s3 = new AWS.S3({
    accessKeyId: config.AWS.accessKey,
    secretAccessKey: config.AWS.secretAccessKey,
});

let Bucket = config.AWS.bucket;

function generateMediaUrl(Key, ContentType) {
  return new Promise((resolve, reject) => {
    const params = { Bucket, Key, ContentType };
    // Note operation in this case is putObject
    s3.getSignedUrl('putObject', params, function(err, url) {
      if (err) {
        reject(err);
      }
      // If there is no errors we can send back the pre-signed PUT URL
      resolve(url);
    });
  }); 
}

module.exports = {
  generateMediaUrl,
  Bucket
}