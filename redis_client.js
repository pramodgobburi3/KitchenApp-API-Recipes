const Redis = require('ioredis');

const options = {
  host: "localhost",
  port: 6379,
  retryStrategy: times => {
    // reconnect after
    return Math.min(times * 50, 2000);
  }
};

const publisher = new Redis(options);
const subscriber = new Redis(options);

module.exports = {
  pub: publisher,
  sub: subscriber
};