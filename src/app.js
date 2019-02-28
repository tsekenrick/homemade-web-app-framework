// app.js
const webby = require('./webby.js');
const path = require('path');
const publicPath = path.join(__dirname, '..', 'public'); // dir from which to serve static content
const app = new webby.App();

app.use(webby.static(publicPath));

// landing page
app.get('/', (req, res) => {
    res.send(`<!DOCTYPE html>
        <head>
            <link rel="stylesheet" type="text/css" href="/css/styles.css">
            <title>Horseshoe Crabs</title>
        </head>
        <body>
            <h1>Horseshoe Crabs!</h1>
            <h2>That's right, bet you didn't see that coming ^^</h2>
            <img src="img/animal4.jpg" class="round">
            <h2><a href="/gallery"><br>...wait but why though???</a></h2>
        </body>
    </html>`);
});

// dynamic image embed
app.get('/gallery', (req, res) => {
    const randomInt = (min, max) => {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min + 1)) + min;
    };

    const imgCount = randomInt(1, 4);
    let imgHtml = '';
    for(let i = 0; i < imgCount; i++){
        imgHtml += `<img src="img/animal${i+1}.jpg"><br>\n`;
    }

    res.send(`<!DOCTYPE html>
        <head>
            <link rel="stylesheet" type="text/css" href="/css/styles.css">
            <title>Gallery</title>
        </head>
        <body>
            <h1>Here ${imgCount > 1 ? 'are' : 'is'} ${imgCount} horseshoe crab${imgCount > 1? 's' : ''}!</h1>
            <h2>Did you know that horseshoe crab blood is blue,<br> and has unique properties that make it useful for quality testing medical products?<br> *the more you know*</h2>
            ${imgHtml}
            </body>
    </html>`);
});

// redirects
app.get('/pics', (req, res) => {
    res.status(301);
    res.set('Location', '/gallery');
    res.send('');
});

app.listen(3000, '127.0.0.1');