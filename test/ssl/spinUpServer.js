const express = require('express');
const fs = require('fs');
const https = require('https');
const bodyParser = require('body-parser');
const path = require('path');

const initAuthorizer = require('../..');
const creds = require('./consumerCreds');

const PORT = 8080;

// Import certificates
const key = fs.readFileSync(path.join(__dirname, 'key.pem'), 'utf8');
const cert = fs.readFileSync(path.join(__dirname, 'cert.pem'), 'utf8');

// Extract consumer credentials
const consumerKey = creds.key;
const consumerSecret = creds.secret;

/* eslint-disable no-console */

/*------------------------------------------------------------------------*/
/*                           Create Express App                           */
/*------------------------------------------------------------------------*/

const app = express();
// Add body parser
app.use(bodyParser.json({ limit: '5mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '5mb' }));

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

initAuthorizer({
  consumerKey,
  consumerSecret,
});
