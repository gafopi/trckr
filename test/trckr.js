
// TODO set up mocha tests. This is just an example


var Trckr = require('../lib/trckr.js');
var moment = require('moment');

var config = {
  "label": "test",
  "fields": ["x", "y"],
  "redis": {
    "url": "localhost",
    "port": 6379,
    "auth": ""
  }
};


var trckr = new Trckr(config);

trckr.clear(function(err,res) {

  var id = 0;

  for (var x=0; x<10; x++) {
    trckr.put({x: x, y: x*x});
  }

  trckr.saveCSV("test.csv", function(err,res) {
    if (err) console.log(err);
    console.log("saved to file");
  });

});
