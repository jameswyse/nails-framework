<img src="/assets/nails@2x.png" width="100%" alt="Nails Framework" title="Nails Framework" />

Nails Framework
===============

Nails is a modular application framework for Node.js. The core package allows you to load external components which add new features to your application.

Nails aims to greatly simplify the creation of feature-rich applications by providing common features such as logging, configuration, user management, api and web serving and admin interface.

Components
----------

### nails-config (core)
A configuration management tool which loads values from a variety of sources. Values can be retrieved by your application and are used to configure plugins.

### nails-logger (core)
A multi-destination streaming JSON logging tool. Powered by bunyan. Can be configured to log to console, syslog, file or rotating file.

### nails-task (core)
Task runner. Add new tasks or run an existing task. Can queue tasks and check conditions. Can load grunt tasks and similar formats. Allows the creation of complex build processes. Streams, can pipe tasks to each other.

### nails-service (core)
A central location to register and locate services within your application. Services abstract the process of consuming external services such as databases, messaging systems and email gateways.

Example services:

 * mongoose - a mongoose + mongodb instance
 * redis - a redis instance
 * instagram - Consume the instagram API via methods or streams.
 * datasift - Stream live data from datasift
 * twitter - Consume the twitter API via methods or streams.
 * leveldb - read/write to leveldb
 * markdown - read/write to markdown files
 * wordpress - read/write to wordpress using XML-RPC
 * mailgun - email!
 * s3 - amazon s3

### nails-web
nails-web is an optimised express instance which adds additional methods for middleware management. This allows plugins to add middleware at specific points in the chain.

##### Features
* Reads from your configuration
* Hooks in to nails-logger to provide request logging and tracking.
* Serves static files
* Provides browserify middleware
* Handles errors

### nails-api
API builder. Restify? Hapi?

### nails-users
Adds Users and Authentication, local or 3rd party OAuth2. Passport.js ?

### nails-admin
Provides a customisable admin interface for your application. Allows admins to mange app configuration and resources and allows users and content editors to easily manage content.

Requires: nails-web, nails-api, nails-users

### nails-task
Create re-usable tasks and run or schedule them. Useful for creating build processes or running  background processes.

Example tasks:

 * stream wordpress posts to mongodb
 * upload images to s3
 * compile stylus/less/sass/etc
 * minify css
 * minify javascript
 * email (mailgun ftw)

### nails-pipeline
Provides tools to work with streams.

### nails-cli
Tools to ease the creation of command line applications.

### nails-mongoose
Provides the mongoose service

### nails-redis
Provides the redis service

### nails-instagram
Provides the instagram service.

### nails-datasift
Provides the datasift service.

### nails-twitter
Provides the twitter service

### nails-facebook
Provides the facebook service

Getting Started
---------------

There will be an app generator eventually, but for now just create a node app and install nails-framework:

```bash
$ mkdir your-app
$ cd your-app
$ touch app.js
$ npm init
$ npm install nails-framework --save
```

Then in `app.js`:

```javascript

var app = require('nails-framework');

// Example - Use the nails-web plugin
require('nails-web');

// Start a web server
app.web.start();
```

More documentation coming soon!

## Licence

The MIT License (MIT)

Copyright (c) 2013 James Wyse <james@jameswyse.net>

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
