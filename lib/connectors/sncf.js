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
        return oneRunner.gotoAsync('https://espace-client.voyages-sncf.com/commandes-en-cours?pastOrder=true');
      })
      .then(() => {
        return oneRunner.waitForCssAsync('#listHistoricalOrders')
      })
      .then(() => {
        return oneRunner.waitForDownloadAsync('sncf', date);
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
      const loginURL = 'https://espace-client.voyages-sncf.com/identification';

      return oneRunner
      .gotoAsync(loginURL)
      .then(() => {
        return oneRunner.waitForCssAsync(
          {
            login:'#login',
            ok:'li[data-auto="menu_orders"]',
        })
      })
      .then((ex) => {
        if (ex.ex.login) {
          return oneRunner.gotoAsync(loginURL)
          .then(() => {
            return oneRunner.waitForCssAsync('#login')
          })
          .then(() => {
            return oneRunner.typeTextAsync('#login', credentials.username)
          })
          .then(() => {
            return oneRunner.typeTextAsync('#password', credentials.password)
          })
          .then(() => {
            return oneRunner.clickAsync('#autologin')
          })
          .then(() => {
            return oneRunner.clickAsync('input#signIn')
          })
          .then(() => {
            return oneRunner.waitForCssAsync({
              login:'div[class="vsc__MEA-message"][role="alert"]',
              ok:'li[data-auto="menu_orders"]',
            })
          })
          .then((ex) => {
            if (ex.ex.login) {
              throw new errors.ConnectorErrorWrongCredentials('Wrong credentials');
            }
          })
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
