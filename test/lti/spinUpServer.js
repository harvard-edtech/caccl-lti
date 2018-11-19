const express = require('express')
const fs = require('fs');
const https = require('https');
const bodyParser = require('body-parser');
const prompt = require('prompt-sync')();
const Validator = require('../../index.js');
const creds = require('./consumerCreds.js');

const PORT = 8080;

// Import certificates
let key = fs.readFileSync(__dirname + '/key.pem', "utf8");
let cert = fs.readFileSync(__dirname + '/cert.pem', "utf8");

// Extract consumer credentials
let consumerKey = creds.key;
let consumerSecret = creds.secret;

const validator = new Validator({
  consumerKey,
  consumerSecret,
});

const app = express();
// Add body parser
app.use(bodyParser.json({ limit: '5mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '5mb' }));

app.post('/launch', (req, res) => {
  validator.isValid(req)
    .then(() => {
      return res.send('Valid');
    })
    .catch((err) => {
      console.log(req.body);
      return res.send(err.message);
    });
});

const server = https.createServer({
  key,
  cert,
}, app);

server.listen(PORT, (err) => {
  if (err) {
    console.log('Could not listen on ' + PORT + ':');
    console.log(err);
  } else {
    console.log('Now listening on port ' + PORT);
    console.log('Direct LTI launch requests to:\nhttps://localhost:' + PORT + '/launch');
  }
});
