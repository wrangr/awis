var awis = require('./index');
var options = {
  key: process.env.AWSACCESSKEYID,
  secret: process.env.AWSSECRETACCESSKEY
};

exports.test1 = function (t) {
  var client = awis(options);
  client({
    'Action': 'UrlInfo',
    'Url': 'github.com',
    'ResponseGroup': 'Related,TrafficData,ContentData'
  }, function (err, res) {
    t.ok(!err);
    t.ok(res.contentData);
    t.equal(res.contentData.dataUrl, 'github.com');
    t.ok(res.trafficData);
    t.equal(res.trafficData.dataUrl, 'github.com');
    t.ok(res.related);
    t.equal(res.related.dataUrl, 'github.com');
    t.done();
  });
};

exports.testTrafficHistory = function (t) {
  awis(options)({
    'Action': 'TrafficHistory',
    'Url': 'lupomontero.com',
    'ResponseGroup': 'History'
  }, function (err, res) {
    t.ok(!err);
    t.ok(res.trafficHistory);
    t.ok(res.trafficHistory.range);
    t.equal(res.trafficHistory.site, 'lupomontero.com');
    t.ok(res.trafficHistory.start);
    t.ok(res.trafficHistory.historicalData);
    t.ok(res.trafficHistory.historicalData.data);
    t.ok(res.trafficHistory.historicalData.data.length);
    res.trafficHistory.historicalData.data.forEach(function (item) {
      t.ok(item.date);
      t.ok(item.pageViews);
      t.ok(item.rank);
      t.ok(item.reach);
    });
    t.done();
  });
};

exports.testSitesLinkingIn = function (t) {
  var client = awis(options);
  client({
    'Action': 'SitesLinkingIn',
    'Url': 'yahoo.com',
    'ResponseGroup': 'SitesLinkingIn',
    'Count': 20
  }, function (err, res) {
    t.ok(!err);
    t.ok(res.sitesLinkingIn);
    t.ok(res.sitesLinkingIn.site);
    t.ok(res.sitesLinkingIn.site.length);
    res.sitesLinkingIn.site.forEach(function (site) {
      t.ok(site.title);
      t.ok(site.url);
    });
    t.done();
  });
};

