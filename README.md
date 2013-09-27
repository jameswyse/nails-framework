<img src="/assets/nails@2x.png" width="100%" alt="Nails Framework" title="Nails Framework" />

    Warning: this project is still in the early stages of development.
    
Nails Framework
===============

Nails is a modular application framework for Node.js. The core module consists of a simple plugin loader and service registry which forms a well-structured base for your application.

Core Concepts
-------------

### Plugins
Plugins are partial applications which allow you to cleanly organise your application. Plugins are given full access to your application object in order to add new features or register services.

### Service Registry
The service registry provides a central location to register and locate services within your application. Services abstract the process of consuming external services such as databases, messaging systems and email gateways.

Available Plugins
-----------------

### [nails-config](https://github.com/nails/nails-config) (core)
A configuration management tool which loads configuration values from argv, env variables and JSON files from your `config` directory.

### [nails-logger](https://github.com/nails/nails-logger) (core)
A streaming JSON logging tool which can log to console, syslog or disk. It can also provide you with a raw stream to allow custom logging destinations.

### [nails-task](https://github.com/nails/nails-task)
A re-usable task runner and scheduler. Allows you to create tasks and run them on demand or on a schedule. Can be used to create complex build processes or to spread resource intensive operations across multiple servers.

### [nails-web](https://github.com/nails/nails-web)
An HTTP router and server based on Express. It includes additional tools for middleware management so other plugins can expose their own web services.

### [nails-schemas](https://github.com/nails/nails-schemas)
A schema registry and set of common schemas and plugins for mongoose.

### [nails-api](https://github.com/nails/nails-api)
Creates REST API endpoints from your mongoose models.

### [nails-admin](https://github.com/nails/nails-admin)
A customisable admin interface for your application. 

### [nails-cli](https://github.com/nails/nails-cli)
Tools to ease the creation of command line applications.

Available Services
------------------

### [nails-mongoose](https://github.com/nails/nails-mongoose)
Provides Object modeling for mongodb.

### [nails-redis](https://github.com/nails/nails-redis)
Provides access to a redis database.

Getting Started
---------------

Documentation to follow. Take a look at the [examples](#) in the mean time.

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
