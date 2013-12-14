var util = require('util');
var crypto = require('crypto');
var _ = require('underscore');
var xml2js = require('xml2js');
var apiDomain = 'awis.amazonaws.com';
var request = require('request').defaults({ url: 'http://' + apiDomain });

function formatTagName(name) {
  // Remove 'aws:' prefix.
  name = name.replace(/^aws:/, '');
  // Make first char lower case.
  return name.charAt(0).toLowerCase() + name.slice(1);
}

function walk(data) {
  if (_.isArray(data)) {
    if (data.length > 1) {
      return _.map(data, function (item) { return walk(item); });
    } else if (data.length === 1) {
      return walk(data[0]);
    }
  } else if (_.isObject(data)) {
    return _.reduce(data, function (memo, v, k) {
      memo[formatTagName(k)] = walk(v);
      return memo;
    }, {});
  } else {
    return data;
  }
}

function parse(xml, req, cb) {
  xml2js.parseString(xml, { ignoreAttrs: true, trim: true }, function (err, data) {
    if (err) { return cb(err); }
    // We need to know the request action in order to know the tag names.
    var action = req.Action;
    // Discard top level nodes. We are only interested on whats inside
    // `aws:Alexa`.
    data = data['aws:' + action + 'Response']['aws:Response'][0];
    data = data['aws:' + action + 'Result'][0]['aws:Alexa'][0];
    cb(null, walk(data));
  });
}

function query(req, options) {
  req.SignatureMethod = 'HmacSHA256';
  req.SignatureVersion = 2;
  req.AWSAccessKeyId = options.key;
  req.Timestamp = new Date().toISOString();

  // Sign...
  // Request keys must be sorted with natural byte ordering.
  // http://docs.aws.amazon.com/AlexaWebInfoService/latest/index.html?CalculatingSignatures.html
  var keys = Object.keys(req).sort();
  var q = keys.reduce(function (memo, k) {
    if (memo) { memo += '&'; }
    return memo + encodeURIComponent(k) + '=' + encodeURIComponent(req[k]);
  }, '');
  var tmpl = 'GET\n%s\n/\n%s';
  var stringToSign = util.format(tmpl, apiDomain, q);
  var signature = crypto.createHmac('SHA256', options.secret);
  signature.update(stringToSign);
  req.Signature = signature.digest('base64');

  return req;
}

module.exports = function (options) {
  return function (req, cb) {
    request({ qs: query(req, options) }, function (err, res) {
      if (err) { return cb(err); }
      parse(res.body, req, cb);
    });
  };
};

