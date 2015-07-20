var assert = require('assert');
var awis = require('../');
var options = {
  key: process.env.AWSACCESSKEYID,
  secret: process.env.AWSSECRETACCESSKEY
};

describe('awis', function () {

  it('should fail when no url is specified', function (done) {
    var client = awis(options);
    client({
      'Action': 'UrlInfo',
      'Url': '',
      'ResponseGroup': 'Related,TrafficData,ContentData'
    }, function (err, res) {
      assert.ok(err instanceof Error);
      assert.ok(/RequiredParameterMissing/.test(err.message));
      assert.ok(!res);
      done();
    });
  });

  it('should fail when bad domain', function (done) {
    var client = awis(options);
    client({
      'Action': 'UrlInfo',
      'Url': 'github.comm&^%$&*',
      'ResponseGroup': 'Related,TrafficData,ContentData'
    }, function (err, res) {
      assert.ok(err instanceof Error);
      assert.ok(/SignatureDoesNotMatch/.test(err.message));
      assert.ok(!res);
      done();
    });
  });

  it('should result in 404 when domain doesnt resolve', function (done) {
    var client = awis(options);
    client({
      'Action': 'UrlInfo',
      'Url': 'some-non-existing-domain.sometld',
      'ResponseGroup': 'ContentData'
    }, function (err, res) {
      assert.ok(!err);
      assert.equal(res.contentData.dataUrl, '404');
      done();
    });
  });

  it('should get all response groups', function (done) {
    var client = awis(options);
    client({
      'Action': 'UrlInfo',
      'Url': 'github.com',
      'ResponseGroup': 'Related,TrafficData,ContentData'
    }, function (err, res) {
      assert.ok(!err);
      assert.ok(res.contentData);
      assert.equal(res.contentData.dataUrl, 'github.com');
      assert.ok(res.trafficData);
      assert.equal(res.trafficData.dataUrl, 'github.com');
      assert.ok(res.related);
      assert.equal(res.related.dataUrl, 'github.com');
      done();
    });
  });

  it('should get all response groups (again)', function (done) {
    var client = awis(options);
    client({
      'Action': 'UrlInfo',
      'Url': 'monono.org',
      'ResponseGroup': 'Related,TrafficData,ContentData'
    }, function (err, res) {
      assert.ok(!err);
      assert.ok(res.contentData);
      assert.equal(res.contentData.dataUrl, 'monono.org');
      assert.ok(res.trafficData);
      assert.equal(res.trafficData.dataUrl, 'monono.org');
      assert.ok(res.related);
      assert.equal(res.related.dataUrl, 'monono.org');
      done();
    });
  });

  it('should get related sites', function (done) {
    var client = awis(options);
    client({
      'Action': 'UrlInfo',
      'Url': 'monono.org',
      'ResponseGroup': 'Related'
    }, function (err, res) {
      assert.ok(!err);
      assert.ok(res.related);
      assert.equal(res.related.dataUrl.replace(/\/$/, ''), 'monono.org');
      done();
    });
  });

  it('should get traffic data', function (done) {
    var client = awis(options);
    client({
      'Action': 'UrlInfo',
      'Url': 'weibo.com',
      'ResponseGroup': 'TrafficData'
    }, function (err, res) {
      assert.ok(!err);
      assert.ok(res.trafficData);
      assert.equal(res.trafficData.dataUrl.replace(/\/$/, ''), 'weibo.com');
      done();
    });
  });

  it('should get traffic history', function (done) {
    awis(options)({
      'Action': 'TrafficHistory',
      'Url': 'lupomontero.com',
      'ResponseGroup': 'History'
    }, function (err, res) {
      assert.ok(!err);
      assert.ok(res.trafficHistory);
      assert.ok(res.trafficHistory.range);
      assert.equal(res.trafficHistory.site, 'lupomontero.com');
      assert.ok(res.trafficHistory.start);
      assert.ok(res.trafficHistory.historicalData);
      assert.ok(res.trafficHistory.historicalData.data);
      assert.ok(res.trafficHistory.historicalData.data.length);
      res.trafficHistory.historicalData.data.forEach(function (item) {
        assert.ok(item.date);
        assert.ok(item.pageViews);
        assert.ok(item.rank);
        assert.ok(item.reach);
      });
      done();
    });
  });

  it('should get sites linking in', function (done) {
    var client = awis(options);
    client({
      'Action': 'SitesLinkingIn',
      'Url': 'yahoo.com',
      'ResponseGroup': 'SitesLinkingIn',
      'Count': 20
    }, function (err, res) {
      assert.ok(!err);
      assert.ok(res.sitesLinkingIn);
      assert.ok(res.sitesLinkingIn.site);
      assert.ok(res.sitesLinkingIn.site.length);
      res.sitesLinkingIn.site.forEach(function (site) {
        assert.ok(site.title);
        assert.ok(site.url);
      });
      done();
    });
  });

  it('should get rank in batch', function (done) {
    var client = awis(options);
    client({
      Action: 'UrlInfo',
      'UrlInfo.Shared.ResponseGroup': 'Rank',
      'UrlInfo.1.Url': 'lupomontero.com',
      'UrlInfo.2.Url': 'yahoo.com',
      'UrlInfo.3.Url': 'weibo.com',
      'UrlInfo.4.Url': 'github.com',
      'UrlInfo.5.Url': 'monono.org'
    }, function (err, res) {
      assert.ok(!err);
      assert.ok(res.length === 5);
      res.forEach(function (response) {
        assert.ok(response.trafficData.dataUrl);
      });
      done();
    });
  });

});


