// app.js
const webby = require('./webby.js');
const app = new webby.App();

// add me some middlware!
app.use((req, res, next) => {
    console.log(req.method, req.path);
    next();
});

app.get('/hello', function(req, res) {
    // send back a response if route matches
    res.send('<h1>HELLO WORLD</h1>');
});

app.get('/', (req, res) => {

});

app.listen(3000, '127.0.0.1');