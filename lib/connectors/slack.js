'use strict';

const bluebird = require('bluebird');
const errors = require('../../errors/errors')
const _ = require('lodash');
const moment = require('moment');


function Connector() {

  this.run = function(date, credentials, oneRunner) {
    return new bluebird.Promise((resolve, reject) => {

      bluebird.promisifyAll(oneRunner);
      const logMe = new logMeIn();


      return logMe
      .run(date, credentials, oneRunner)
      .then(() => {
        const now = moment();
        const monthsDiff = parseInt(now.diff(date, 'months'));
        const monthlyURL = 'https://'+credentials.team+'.slack.com/admin/billing?page='+monthsDiff+'#history';
        console.log('agi en consequence: ', monthlyURL)

        return oneRunner.gotoAsync(monthlyURL)
      })
      .then(() => {
        return oneRunner
        .waitForDownloadAsync('slack', date);
      })
      .then(resolve)
      .catch(reject)

    });
  }
}

function logMeIn() {
  this.run = function(date, credentials, oneRunner) {
    date = null;

    return new bluebird.Promise((resolve, reject) => {
      const loginURL = 'https://'+credentials.team+'.slack.com/admin/billing/';

      return oneRunner
      .gotoAsync(loginURL)
      .then(() => {
        return oneRunner.waitForCssAsync(
          {
            login:'#email',
            ok:'a[href*="/admin/billing/settings"]',
            teamerror: '#content[data-background="404"]'
        })
      })
      .then((ex) => {
        if (ex.ex.teamerror) {
          throw new errors.ConnectorErrorWrongCredentials('Wrong team name');
        }
        else if (ex.ex.login) {

          return oneRunner
          .typeTextAsync('#email', credentials.username)
          .then(() => {
            return oneRunner.typeTextAsync('#password', credentials.password)
          })
          .then(() => {
            return oneRunner.clickAsync('#signin_btn')
          })
          .then(() => {
            return oneRunner.waitForPageAsync();
          })
        }
      })
      .then(() => {
        return oneRunner.validateLoginAsync({login:'#email', ok:'a[href*="/admin/billing/settings"]'}, null)
      })
      .then((ex) => {
        if (ex.ex.login) {
          throw new errors.ConnectorErrorWrongCredentials('Wrong credentials');
        }
      })

      .then(() => {
        resolve();
      })
      .catch(reject);
    })

  }
}


exports.billFetcher = Connector;
exports.logMeIn = logMeIn;
