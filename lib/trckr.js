
var moment = require('moment');
var shortid = require('shortid');
var async = require('async');
var json2csv = require('json2csv');
var fs = require('fs');


/**
 * Logger Object
 */

function Trckr(config) {

  var label = config.label;
  var fields = config.fields;

  console.log("LOG: ", label, fields);

  var redis_client = require("./redis-client.js")(config.redis.url, config.redis.port, config.redis.auth);

  /**
   * generateKey - private method to generate a unique log key
   *
   * @return {String}  unique key for log
   */
  var generateKey = function() {
    var dateString = moment().format("YYYY-MM-DD-HH-mm-ss");
    return "trckr-" + label + "-" + shortid.generate();
    //return label + "-" + dateString + "-" + shortid.generate();
  }


  /**
   * validate - check if log is valid
   *
   * @param  {type} log description
   * @return {type}     description
   */
  var validate = function(log) {
    for (key in log) {
      if (!fields.includes(key)) return false;
    }
    for (key in fields) {
      if (!(fields[key] in log)) return false;
    }
    return true;
  }

  /**
   * put - insert a log
   *
   * @param  {type} log the log to log
   */
  this.put = function(log) {
    if (validate(log)) {
      var key = generateKey();

      // redis set takes list as parameter
      // i.e. [key1, value1, key2, value2]
      var params = [];
      for (key in log) {
        params.push(key);
        params.push(log[key]);
      }

      redis_client.hmset(generateKey(), params);
    } else {
      throw new Error("invalid log");
    }
  }

  /**
   * getLogs - get all logs belonging to this trckr
   *
   * @param  {type} cb description
   */
  this.get = function(cb) {
    redis_client.keys("trckr-" + label + "-*", function(err,logIds) {
      if (err) return cb(err, null);

      // in parallel, get all ids
      var p = logIds.map(function(logId) {
        return function(callback) {
          redis_client.hgetall(logId, function(e,r) {
            if(e) callback(e);
            callback(null, r);
          });
        }
      });

      async.parallel(p, function(err,res) {
        cb(null,res);
      });

    });
  };

  /**
   * clear - clear all logs belonging to this trckr
   *
   * @param  {type} cb description
   */
  this.clear = function(cb) {
    if (!cb) cb = function() {};
    redis_client.keys("trckr-" + label + "-*", function(err,logIds) {
      if (err) return cb(err, null);

      // in parallel, get all ids
      var p = logIds.map(function(logId) {
        return function(callback) {
          redis_client.del(logId, function(e,r) {
            if(e) callback(e);
            callback(null, r);
          });
        }
      });

      async.parallel(p, function(err,res) {
        cb(null,res);
      });

    });
  };


  /**
   * getCSV - get logs in CSV format
   *
   * @return {type}  description
   */
  this.getCSV = function(cb) {
    this.get(function(err, res) {
      if (err) return cb(err, null);

      // write date to CSV
      try {
        var csv = json2csv({ data: res, fields: fields });
        cb(null, csv);
      } catch (err) {
        console.error(err);
        cb(err, null);
      }

    })
  }

  /**
   * saveJSON - write data to file as JSON
   *
   * @param  {type} filename description
   * @param  {type} cb       description
   * @return {type}          description
   */
  this.saveJSON = function(filename, cb) {
    this.get(function(err,res) {
      if (err) return cb(err);
        var stream = fs.createWriteStream(filename);
        stream.once('open', function(fd) {
          stream.write(JSON.stringify(res));
          stream.end();
          cb(null, true);
        });
    })
  }

  /**
   * saveCSV - write data to file as CSV
   *
   * @param  {type} filename description
   * @param  {type} cb       description
   * @return {type}          description
   */
  this.saveCSV = function(filename, cb) {
    this.getCSV(function(err,res) {
      if (err) return cb(err);
        var stream = fs.createWriteStream(filename);
        stream.once('open', function(fd) {
          stream.write(res);
          stream.end();
          cb(null, true);
        });
    })
  }

}


module.exports = Trckr;
