const express = require('express')
const fs = require('fs');
const https = require('https');
const bodyParser = require('body-parser');
const prompt = require('prompt-sync')();
const Validator = require('../../index.js');

// Import certificates
let key = fs.readFileSync(__dirname + '/key.pem', "utf8");
let cert = fs.readFileSync(__dirname + '/cert.pem', "utf8");

console.log('\n\nPlease enter your app credentials:');
let consumerKey = prompt('consumer_key: ');
let consumerSecret = prompt('consumer_secret: ');

const validator = new Validator({
  consumerKey: consumerKey,
  consumerSecret: consumerSecret
});

const app = express()
// Add body parser
app.use(bodyParser.json({limit: '5mb'}));
app.use(bodyParser.urlencoded({extended: true, limit: '5mb'}));

app.post('/launch', (req, res) => {
  console.log('Fail?', !req);
  validator.isValid(req)
  .then(() => {
    // Valid
    res.send('Valid');
  }).catch((err) => {
    // Invalid
    console.log(err);
    res.send('INVALID:' + err.message);
  });
});

const server = https.createServer({
  key: key,
  cert: cert
}, app);

server.listen(8080, (err) => {
  if (err) {
    console.log('Could not listen on 8080:');
    console.log(err);
  } else {
    console.log('Now listening on port 8080');
  }
});
