'use strict';


const Assert = require('assert');
const Awis = require('../');


const options = {
  key: process.env.AWSACCESSKEYID,
  secret: process.env.AWSSECRETACCESSKEY
};


describe('Awis', () => {


  it('should fail when no url is specified', (done) => {

    Awis(options)({
      'Action': 'UrlInfo',
      'Url': '',
      'ResponseGroup': 'Related,TrafficData,ContentData'
    }, (err, res) => {

      Assert.ok(err instanceof Error);
      Assert.ok(/XML response missing aws:Response/.test(err.message));
      Assert.ok(!res);
      done();
    });
  });


  it('should fail when bad domain', (done) => {

    Awis(options)({
      'Action': 'UrlInfo',
      'Url': 'github.comm&^%$&*',
      'ResponseGroup': 'Related,TrafficData,ContentData'
    }, (err, res) => {

      Assert.ok(err instanceof Error);
      Assert.ok(/Invalid Url parameter value/.test(err.message));
      Assert.ok(!res);
      done();
    });
  });


  it('should result in 404 when domain doesnt resolve', (done) => {

    Awis(options)({
      'Action': 'UrlInfo',
      'Url': 'some-non-existing-domain.sometld',
      'ResponseGroup': 'ContentData'
    }, (err, res) => {

      Assert.ok(!err);
      Assert.equal(res.contentData.dataUrl, '404');
      done();
    });
  });


  it('should get all response groups', (done) => {

    Awis(options)({
      'Action': 'UrlInfo',
      'Url': 'github.com',
      'ResponseGroup': 'Related,TrafficData,ContentData'
    }, (err, res) => {

      Assert.ok(!err);
      Assert.ok(res.contentData);
      Assert.equal(res.contentData.dataUrl, 'github.com');
      Assert.ok(res.trafficData);
      Assert.equal(res.trafficData.dataUrl, 'github.com');
      Assert.ok(res.related);
      Assert.equal(res.related.dataUrl, 'github.com');
      done();
    });
  });


  it('should get all response groups (again)', (done) => {

    Awis(options)({
      'Action': 'UrlInfo',
      'Url': 'monono.org',
      'ResponseGroup': 'Related,TrafficData,ContentData'
    }, (err, res) => {

      Assert.ok(!err);
      Assert.ok(res.contentData);
      Assert.equal(res.contentData.dataUrl, 'monono.org');
      Assert.ok(res.trafficData);
      Assert.equal(res.trafficData.dataUrl, 'monono.org');
      Assert.ok(res.related);
      Assert.equal(res.related.dataUrl, 'monono.org');
      done();
    });
  });


  it('should get related sites', (done) => {

    Awis(options)({
      'Action': 'UrlInfo',
      'Url': 'monono.org',
      'ResponseGroup': 'Related'
    }, (err, res) => {

      Assert.ok(!err);
      Assert.ok(res.related);
      Assert.equal(res.related.dataUrl.replace(/\/$/, ''), 'monono.org');
      done();
    });
  });


  it('should get traffic data', (done) => {

    Awis(options)({
      'Action': 'UrlInfo',
      'Url': 'weibo.com',
      'ResponseGroup': 'TrafficData'
    }, (err, res) => {

      Assert.ok(!err);
      Assert.ok(res.trafficData);
      Assert.equal(res.trafficData.dataUrl.replace(/\/$/, ''), 'weibo.com');
      done();
    });
  });


  it('should get rank by country', (done) => {

    Awis(options)({
      'Action': 'UrlInfo',
      'Url': 'yahoo.com',
      'ResponseGroup': 'RankByCountry',
      'Count': 20
    }, (err, res) => {

      Assert.ok(!err);
      Assert.ok(res.trafficData);
      Assert.ok(res.trafficData.rankByCountry);
      Assert.ok(res.trafficData.rankByCountry.country);
      Assert.ok(res.trafficData.rankByCountry.country.length);
      res.trafficData.rankByCountry.country.forEach((item) => {

        Assert.equal(typeof item.code, 'string');
        Assert.equal(typeof item.rank, 'string');
        Assert.ok(item.contribution);
      });
      done();
    });
  });


  it('should get traffic history', (done) => {

    Awis(options)({
      'Action': 'TrafficHistory',
      'Url': 'google.com',
      'ResponseGroup': 'History'
    }, (err, res) => {

      Assert.ok(!err);
      Assert.ok(res.trafficHistory);
      Assert.ok(res.trafficHistory.range);
      Assert.equal(res.trafficHistory.site, 'google.com');
      Assert.ok(res.trafficHistory.start);
      Assert.ok(res.trafficHistory.historicalData);
      Assert.ok(res.trafficHistory.historicalData.data);
      Assert.ok(res.trafficHistory.historicalData.data.length);
      res.trafficHistory.historicalData.data.forEach((item) => {

        Assert.ok(item.date);
        Assert.ok(item.pageViews);
        Assert.ok(item.rank);
        Assert.ok(item.reach);
      });
      done();
    });
  });


  it('should get sites linking in', (done) => {

    Awis(options)({
      'Action': 'SitesLinkingIn',
      'Url': 'yahoo.com',
      'ResponseGroup': 'SitesLinkingIn',
      'Count': 20
    }, (err, res) => {

      Assert.ok(!err);
      Assert.ok(res.sitesLinkingIn);
      Assert.ok(res.sitesLinkingIn.site);
      Assert.ok(res.sitesLinkingIn.site.length);
      res.sitesLinkingIn.site.forEach((site) => {

        Assert.ok(site.title);
        Assert.ok(site.url);
      });
      done();
    });
  });


  it('should get rank in batch', (done) => {

    Awis(options)({
      Action: 'UrlInfo',
      'UrlInfo.Shared.ResponseGroup': 'Rank',
      'UrlInfo.1.Url': 'lupomontero.com',
      'UrlInfo.2.Url': 'yahoo.com',
      'UrlInfo.3.Url': 'weibo.com',
      'UrlInfo.4.Url': 'github.com',
      'UrlInfo.5.Url': 'monono.org'
    }, (err, res) => {

      Assert.ok(!err);
      Assert.ok(res.length === 5);
      res.forEach((response) => {

        Assert.ok(response.trafficData.dataUrl);
      });
      done();
    });
  });


  it('should get category list', (done) => {

    Awis(options)({
      'Action': 'CategoryListings',
      'ResponseGroup': 'Listings',
      'Path': 'Top/Shopping/Clothing'
    }, (err, res) => {

      Assert.ok(!err);
      Assert.equal(typeof res.categoryListings.recursiveCount, 'string');
      Assert.equal(typeof res.categoryListings.count, 'string');
      Assert.equal(typeof res.categoryListings.listings, 'object');
      Assert.ok(res.categoryListings.listings.listing.length > 0);

      res.categoryListings.listings.listing.forEach((listing) => {

        Assert.equal(typeof listing.dataUrl, 'string');
        Assert.equal(typeof listing.title, 'string');
        Assert.equal(typeof listing.popularityRank, 'string');
      });

      done();
    });
  });


  it.skip('should allow apostrophe in path when doing CategoryBrowse', (done) => {

    Awis(options)({
      Action: 'CategoryBrowse',
      ResponseGroup: 'Categories',
      Path: 'Top/Shopping/Clothing/Martin\'s'
    }, (err, res) => {

      Assert.ok(!err);
      Assert.ok(res.categoryBrowse.categories.category);
      Assert.equal(typeof res.categoryBrowse.categories.category.length, 'number');
      Assert.ok(res.categoryBrowse.categories.category.length > 0);
      res.categoryBrowse.categories.category.forEach((item) => {

        Assert.equal(typeof item.path, 'string');
        Assert.equal(typeof item.title, 'string');
      });
      done();
    });
  });


  it('should allow to query Alexa TopSites', (done) => {

    Awis(options)({
      Action: 'TopSites',
      CountryCode: 'PE',
      Start: 1,
      Count: 100,
      ResponseGroup: 'Country'
    }, (err, res) => {

      Assert.ok(!err);
      Assert.equal(res.topSites.country.countryName, 'Peru');
      Assert.equal(res.topSites.country.countryCode, 'PE');
      Assert.equal(typeof res.topSites.country.totalSites, 'string');
      Assert.equal(res.topSites.country.sites.site.length, 99);

      res.topSites.country.sites.site.forEach((site) => {

        Assert.equal(typeof site.dataUrl, 'string');
        Assert.equal(typeof site.country.rank, 'string');
        Assert.equal(typeof site.country.reach.perMillion, 'string');
        Assert.equal(typeof site.country.pageViews.perMillion, 'string');
        Assert.equal(typeof site.country.pageViews.perUser, 'string');
        Assert.equal(typeof site.global.rank, 'string');
      });

      done();
    });
  });


});
