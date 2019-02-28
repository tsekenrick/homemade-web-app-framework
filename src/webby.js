// webby.js
const net = require('net');
const path = require('path');
const fs = require('fs');

const HTTP_STATUS_CODES = {
    200: 'OK',
    301: 'Moved Permanently',
    404: 'Not Found',
    500: 'Internal Server Error'
};

const MIME_TYPES = {
    'jpg':'image/jpeg',
    'jpeg':'image/jpeg',
    'png':'image/png',
    'html':'text/html',
    'css':'text/css',
    'txt':'text/plain'
};

function getExtension(fileName) {
    return path.extname(fileName).slice(1);
}

function getMIMEType(fileName) {
    return getExtension(fileName) === '' ? '' : MIME_TYPES[getExtension(fileName)];
}

class Request {
    constructor(httpRequest) {
        const [method, path] = httpRequest.split(' '); // destructuring assignment
        this.path = path;
        this.method = method;
    }
}

class Response {
    constructor(sock, statusCode=200, version='HTTP/1.1') {
        this.sock = sock;
        this.statusCode = statusCode;
        this.version = version;
        this.headers = {};
        this.body = '';
    }

    set(name, value) {
        this.headers[name] = value;
    }

    end() {
        this.sock.end();
    }

    statusLineToString() {
        return `${this.version} ${this.statusCode} ${HTTP_STATUS_CODES[this.statusCode]}\r\n`;
    }

    headersToString() {
        return Object.keys(this.headers).reduce((acc, cur) => {
            return acc + `${cur}: ${this.headers[cur]}\r\n`;
        }, '');
    }

    send(body) {
        this.sock.write(this.statusLineToString());
        this.sock.write(this.headersToString());
        if(!this.headers.hasOwnProperty('Content-Type')) {
            this.sock.write('Content-Type: text/html\r\n');
        }
        this.sock.write('\r\n');
        this.sock.write(body);
        this.end();
    }

    status(statusCode) {
        this.statusCode = statusCode;
        return this;
    }
}

class App {
    constructor() {
        this.routes = {};
        this.middleware = null;
        this.server = net.createServer(sock => this.handleConnection(sock));
    }

    normalizePath(path) {
        path = path.toLowerCase();
        if(path.includes('#')) { path = path.split('#')[0]; }
        else if(path.includes('?')) { path = path.split('?')[0]; }

        if(path.slice(-1) === '/') { path = path.slice(0, -1); }

        return path;
    }

    createRouteKey(method, path) {
        let routeKey = method.toUpperCase();
        routeKey += ' ' + this.normalizePath(path);

        return routeKey;
    }

    get(path, cb) {
        this.routes[this.createRouteKey('GET', this.normalizePath(path))] = cb;
    }

    use(cb) {
        this.middleware = cb;
    }

    listen(port, host) {
        this.server.listen(port, host);
    }

    handleConnection(sock) {
        sock.on('data', this.handleRequest.bind(this, sock));
    }

    handleRequest(sock, binaryData) {
        const req = new Request(binaryData + '');
        const res = new Response(sock);
        if(this.middleware !== null) {
            this.middleware(req, res, this.processRoutes.bind(this, req, res));
        } else {
            this.processRoutes(req, res);
        }
    }

    processRoutes(req, res) {
        const key = [this.createRouteKey(req.method, req.path)];
        if(this.routes.hasOwnProperty(key)) {
            this.routes[key](req, res);
        } else {
            const newRes = new Response(res.sock, 404);
            newRes.send('Page not found.');
        }
    }
}

function serveStatic(basePath) {
    return (req, res, next) => {
        const completePath = path.join(basePath, req.path);
        fs.readFile(completePath, (err, data) => {
            // if no file at given path, call next
            if(err) {
                next(req, res);
            // success!
            } else {
                res.status(200);
                res.set('Content-Type', `${getMIMEType(basePath)}`);
                res.send(data);
            }
        });
    };
}

module.exports = {
    App,
    Request,
    Response,
    static: serveStatic,
    getExtension,
    getMIMEType,
    HTTP_STATUS_CODES,
    MIME_TYPES
  };