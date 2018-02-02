'use strict';

const _ = require('lodash');
const Xml2js = require('xml2js');
const Request = require('request');
const Url = require('url');
const Aws4 = require('aws4');


const internals = {};


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
    if (data._) {
      return data._;
    }
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


  Xml2js.parseString(xml, { mergeAttrs: true, trim: true }, (err, data) => {

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


module.exports = function (options) {

  return function (req, cb) {

    const region = options.region || 'us-west-1';
    const host = (req.Action === 'TopSites') ? `ats.${region}.amazonaws.com` : `awis.${region}.amazonaws.com`;
    const service = (req.Action === 'TopSites') ? 'AlexaTopSites' : 'awis';
    const pathname = '/api';

    const search = Object.keys(req).sort().reduce((memo, k) => {

      if (memo) {
        memo += '&';
      }
      // Manually replace single quotes with `%27` as `encodeURIComponent` doesnt
      // seem to encode them, and things break:
      // https://github.com/wrangr/awis/issues/3
      const value = encodeURIComponent(req[k]).replace(/'/g, '%27');
      return memo + encodeURIComponent(k) + '=' + value;
    }, '');

    const path = pathname + '?' + search;
    const url = Url.format({ protocol: 'https:', host, pathname, search });

    const signOpts = {
      url,
      host,
      service,
      path
    };

    const signRes = Aws4.sign(signOpts, {
      accessKeyId: options.key,
      secretAccessKey: options.secret
    });

    Request(signRes, (err, res) => {

      if (err) {
        return cb(err);
      }

      internals.parse(res.body, req, cb);
    });
  };
};
