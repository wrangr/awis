'use strict';

const Util = require('util');
const Crypto = require('crypto');
const _ = require('lodash');
const Xml2js = require('xml2js');
const Request = require('request');


const internals = {
  apiDomain: 'awis.amazonaws.com'
};



internals.formatTagName = function (name) {

  // Remove 'aws:' prefix.
  name = name.replace(/^aws:/, '');
  // Make first char lower case.
  return name.charAt(0).toLowerCase() + name.slice(1);
};


internals.walk = function (data) {

  if (_.isArray(data)) {
    if (data.length > 1) {
      return _.map(data, (item) => {

        return internals.walk(item);
      });
    }
    else if (data.length === 1) {
      return internals.walk(data[0]);
    }
  }
  else if (_.isObject(data)) {
    return _.reduce(data, (memo, v, k) => {

      memo[internals.formatTagName(k)] = internals.walk(v);
      return memo;
    }, {});
  }
  else {
    return data;
  }
};


internals.parse = function (xml, req, cb) {

  const action = req.Action;
  const responseKey = 'aws:' + action + 'Response';
  const actionResultKey = 'aws:' + action + 'Result';

  const validateResponse = function (data, json) {

    if (!_.isArray(data['aws:ResponseStatus'])) {
      throw new Error('XML response missing aws:ResponseStatus!\n' + json);
    }

    if (!_.isArray(data['aws:ResponseStatus'][0]['aws:StatusCode'])) {
      throw new Error('XML response missing aws:StatusCode!\n' + json);
    }

    const statusCode = data['aws:ResponseStatus'][0]['aws:StatusCode'][0];
    if (statusCode !== 'Success') {
      throw new Error(statusCode + '\n' + json);
    }

    if (!_.isArray(data[actionResultKey]) || !data[actionResultKey].length) {
      throw new Error('XML response missing ' + actionResultKey + '!\n' + json);
    }

    data = data[actionResultKey][0]['aws:Alexa'][0];
    return internals.walk(data);
  };


  Xml2js.parseString(xml, { ignoreAttrs: true, trim: true }, (err, data) => {

    if (err) {
      return cb(err);
    }

    // json string representation of response data (for debugging).
    const json = JSON.stringify(data, null, '  ');

    // We need to know the request action in order to know the tag names.
    if (data.Response && _.isArray(data.Response.Errors)) {
      return cb(new Error(data.Response.Errors.reduce((memo, error) => {

        if (memo) {
          memo += '\n';
        }
        memo += error.Error[0].Code[0] + ': ' + error.Error[0].Message[0];
        return memo;
      }, '')));
    }

    if (!data[responseKey] || !_.isArray(data[responseKey]['aws:Response'])) {
      return cb(new Error('XML response missing aws:Response!\n' + json));
    }

    // Discard top level nodes. We are only interested on whats inside
    // `aws:Alexa`.
    data = data[responseKey]['aws:Response'];

    // Batch requests support
    let all = [];
    try {
      for (let i = 0; i < data.length; ++i) {
        // Require all responses to be valid
        all.push(validateResponse(data[i], json));
      }
    }
    catch (e) {
      return cb(e);
    }

    // If it isn't a batch request, be backwards compatible (single response object)
    if (all.length === 1) {
      all = all[0];
    }

    cb(null, all);
  });
};


internals.query = function (req, options) {

  req.SignatureMethod = 'HmacSHA256';
  req.SignatureVersion = 2;
  req.AWSAccessKeyId = options.key;
  req.Timestamp = new Date().toISOString();

  // Sign...
  // Request keys must be sorted with natural byte ordering.
  // http://docs.aws.amazon.com/AlexaWebInfoService/latest/index.html?CalculatingSignatures.html
  const keys = Object.keys(req).sort();
  const q = keys.reduce((memo, k) => {

    if (memo) {
      memo += '&';
    }
    // Manually replace single quotes with `%27` as `encodeURIComponent` doesnt
    // seem to encode them, and things break:
    // https://github.com/wrangr/awis/issues/3
    const value = encodeURIComponent(req[k]).replace(/'/g, '%27');
    return memo + encodeURIComponent(k) + '=' + value;
  }, '');
  const tmpl = 'GET\n%s\n/\n%s';
  const stringToSign = Util.format(tmpl, internals.apiDomain, q);
  const signature = Crypto.createHmac('SHA256', options.secret);
  signature.update(stringToSign);
  req.Signature = signature.digest('base64');

  return req;
};


module.exports = function (options) {

  return function (req, cb) {

    Request({
      url: 'http://' + internals.apiDomain,
      qs: internals.query(req, options)
    }, (err, res) => {

      if (err) {
        return cb(err);
      }

      internals.parse(res.body, req, cb);
    });
  };
};

