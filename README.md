# awis

[![Greenkeeper badge](https://badges.greenkeeper.io/wrangr/awis.svg)](https://greenkeeper.io/)

[![NPM](https://nodei.co/npm/awis.png?compact=true)](https://nodei.co/npm/awis/)

[![Build Status](https://secure.travis-ci.org/wrangr/awis.png)](http://travis-ci.org/wrangr/awis)
[![Dependency Status](https://david-dm.org/wrangr/awis.png)](https://david-dm.org/wrangr/awis)
[![devDependency Status](https://david-dm.org/wrangr/awis/dev-status.png)](https://david-dm.org/wrangr/awis#info=devDependencies)

[Node.js](http://nodejs.org/) client for the [Alexa Web Information
Service](http://aws.amazon.com/awis/).

## Installation

```sh
$ npm install --save awis
```

## Usage

Basic usage:

```javascript
var awis = require('awis');

var client = awis({
  key: process.env.AWSACCESSKEYID,
  secret: process.env.AWSSECRETACCESSKEY
});

client({
  'Action': 'UrlInfo',
  'Url': 'foo.com',
  'ResponseGroup': 'Related,TrafficData,ContentData'
}, function (err, data) {
  // ...
});
```

Batch request:

```js
client({
  Action: 'UrlInfo',
  'UrlInfo.Shared.ResponseGroup': 'Rank',
  'UrlInfo.1.Url': 'lupomontero.com',
  'UrlInfo.2.Url': 'yahoo.com',
  'UrlInfo.3.Url': 'weibo.com',
  'UrlInfo.4.Url': 'github.com',
  'UrlInfo.5.Url': 'monono.org'
}, function (err, data) {
  // res.length === 5
  // data is an array with a response object for each domain
  data.forEach(function (item) {
    console.log(item.trafficData.dataUrl);
  });
});
```

## API

### `client( request, callback )`

Issue request with client.

#### `request`

The `request` object must always have an `Action` property. The AWIS API
supports the following actions:

* `UrlInfo` - get information about pages and sites on the web - their traffic,
content, and related sites.

* `TrafficHistory` - get a history of traffic rank.

* `CategoryBrowse`, `CategoryListings` - get lists of sites within a specific
category ordered by traffic rank, or create a browseable directory of websites.

* `SitesLinkingIn` - get a list of sites linking in to a specified site.

For more details please check the [Alexa Web Information Service
documentation](http://docs.aws.amazon.com/AlexaWebInfoService/latest/).

## License

The MIT License (MIT)

Copyright (c) 2015 Lupo Montero &lt;lupo@wrangr.com&gt;

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
