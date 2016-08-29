'use strict';

var events = require('events');
var util = require('util');
var Promise = require('bluebird');
var debug = require('debug');
var lodash = require('lodash');
var debuglog = debug('logulator:agent:target:mongodb');
var MongoClient = require('mongodb').MongoClient;

function TargetMongodb(params) {
    var self = this;
    debuglog(' + constructor start');
    params = params || {};

    this._fields = lodash.pick(params, ['connectionString', 'collectionName']);

    if (lodash.isEmpty(this._fields.connectionString)) {
        callback && callback('connectionString not found');
        return;
    }
    if (lodash.isEmpty(this._fields.collectionName)) {
        callback && callback('collectionName not found');
        return;
    }

    var targetDB;
    var collection;
    MongoClient.connect(self._fields.connectionString, function (err, db) {
        targetDB = db;
        collection = db.collection(self._fields.collectionName);
        debuglog("Connect database successfully");
    });

    this.push = function (msg, callback) {
        collection.insertOne(msg, function (err, result) {
            debuglog(" - Inserted 1 document : %s", JSON.stringify(msg));
            callback(err, result);
        });
    }

    this.destroy = function () {
        targetDB.close();
        debuglog(' - targetMongodb[%s] has been destroyed', this._fields.connectionString);
        return Promise.resolve({});
    };

    debuglog(' - constructor end');
}

util.inherits(TargetMongodb, events.EventEmitter);

module.exports = TargetMongodb;
