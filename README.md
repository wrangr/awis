# awis [![Build Status](https://secure.travis-ci.org/wrangr/awis.png)](http://travis-ci.org/wrangr/awis)

[Node.js](http://nodejs.org/) client for the [Alexa Web Information
Service](http://aws.amazon.com/awis/).

## Installation

```
$ npm install awis --save
```

## Examples

```javascript
var credentials = {
  key: process.env.AWSACCESSKEYID,
  secret: process.env.AWSSECRETACCESSKEY
};
var awis = require('awis')(credentials);
awis({
  'Action': 'UrlInfo',
  'Url': 'foo.com',
  'ResponseGroup': 'Related,TrafficData,ContentData'
}, function (err, data) {
  // ...
});
```

## Actions

* `UrlInfo` - get information about pages and sites on the web - their traffic,
  content, and related sites.

* `TrafficHistory` - get a history of traffic rank.

* `CategoryBrowse`, `CategoryListings` - get lists of sites within a specific
category ordered by traffic rank, or create a browseable directory of websites.

* `SitesLinkingIn` - get a list of sites linking in to a specified site.

For more details please check the [Alexa Web Information Service
documentation](http://docs.aws.amazon.com/AlexaWebInfoService/latest/).


## License

[The MIT License](https://github.com/wrangr/awis/blob/master/LICENSE)
