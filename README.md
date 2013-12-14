# awis

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

