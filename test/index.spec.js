// Main tests for caccl-lti
const express = require('express');
const session = require('express-session');
const fs = require('fs');
const clone = require('fast-clone');
const https = require('https');
const bodyParser = require('body-parser');
const path = require('path');
const oauth = require('oauth-signature');
require('dce-selenium');

const initAuthorizer = require('..');
const valid = require('./examples/launches/valid.js');

const {
  consumerSecret,
  consumerKey,
} = valid;

const PORT = 8080;

// Import certificates
const key = fs.readFileSync(path.join(__dirname, 'ssl', 'key.pem'), 'utf8');
const cert = fs.readFileSync(path.join(__dirname, 'ssl', 'cert.pem'), 'utf8');

/* eslint-disable no-console */

/*------------------------------------------------------------------------*/
/*                             Initialize App                             */
/*------------------------------------------------------------------------*/

const initApp = async function (driver) {
  // Set up app
  const app = express();
  // Add body parser
  app.use(bodyParser.json({ limit: '5mb' }));
  app.use(bodyParser.urlencoded({ extended: true, limit: '5mb' }));

  // Create session secret
  const sessionSecret = `test-app-session-${new Date().getTime()}`;

  // Create cookie name
  const cookieName = `test-app-cookie-${new Date().getTime()}-53901`;

  // Set session duration to 6 hours
  const sessionDurationMillis = 360 * 60000;

  // Add session
  app.use(session({
    cookie: {
      maxAge: sessionDurationMillis,
    },
    resave: true,
    name: cookieName,
    saveUninitialized: false,
    secret: sessionSecret,
  }));

  const server = https.createServer({
    key,
    cert,
  }, app);

  await new Promise((resolve) => {
    server.listen(PORT, (err) => {
      if (err) {
        driver.log('Could not listen on ' + PORT + ':');
        driver.log(err);
        throw err;
      } else {
        resolve();
      }
    });
  });

  initAuthorizer({
    app,
    installationCredentials: {
      consumer_key: consumerKey,
      consumer_secret: consumerSecret,
    },
    disableAuthorizeOnLaunch: true,
    redirectToAfterLaunch: '/done',
  });

  app.get('/launchinfo', (req, res) => {
    return res.json(req.session.launchInfo);
  });

  app.get('/done', (req, res) => {
    return res.send('done');
  });

  return () => {
    server.close();
  };
};

/*------------------------------------------------------------------------*/
/*                                  Tests                                 */
/*------------------------------------------------------------------------*/

describe('caccl-lti', function () {
  itd('Accepts valid launches', async function (driver) {
    const kill = await initApp();

    let error;
    try {
      for (let i = 0; i < Math.min(10, valid.examples.length); i++) {
        const url = `https://localhost:${PORT}/launch`;

        const example = valid.examples[i];
        const body = clone(example.body);

        // Reset timestamp
        body.oauth_timestamp = String(Math.ceil(Date.now() / 1000));

        body.oauth_signature = decodeURIComponent(
          oauth.generate(
            valid.method,
            valid.url,
            body,
            valid.consumerSecret
          )
        );

        // Send LTI launch request
        /* eslint-disable no-await-in-loop */
        await driver.post(url, body, 'https://localhost:8080/done');
      }
    } catch (err) {
      error = err;
    }

    kill();
    if (error) {
      throw error;
    }
  });
});

/*------------------------------------------------------------------------*/
/*                           Create Express App                           */
/*------------------------------------------------------------------------*/
