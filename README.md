
# trckr

Simple utility to track whatever you want for analytic purposes, with redis.

In progress. More info coming soon.


## Installation

```bash
git clone ...
cd trckr
npm install
```


## Example Usage

```javascript

var config = {
  "label": "test",
  "fields": ["x", "y"],
  "redis": {
    "url": "localhost",
    "port": 6379,
    "auth": ""
  }
};

var Trckr = require('trckr');
var trckr = new Trckr(config);

for (var x=0; x<100; x++) {
  trckr.put({x: x, y: x*x});
}

trckr.writeToFileCSV("test.csv", function(err,res) {
  if (err) console.log(err);
  console.log("saved to CSV file");
});


```
