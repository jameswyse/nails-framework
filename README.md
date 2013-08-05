<img src="/assets/nails@2x.png" width="100%" alt="Nails Framework" title="Nails Framework" />

Nails Framework
===============

Nails Framework is a framework for Node.js based around plugins.

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
