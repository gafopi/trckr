
var assert = require('assert');

module.exports = function(url, port, auth) {

  var redis = require("redis").createClient(port, url);

  redis.on("error", function(err) {
    assert(err instanceof Error);
    console.log("Redis server error: " + err);
  });

  redis.on("end", function() {
    console.log("Redis server connection closed.");
    process.exit(1);
  })

  redis.on("connect", function() {
    redis.auth(auth);
    console.log("Redis server connection established and authorized.");
  });

  return redis;
}
