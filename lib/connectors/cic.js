'use strict';

const bluebird = require('bluebird');
const errors = require('../../errors/errors')
const _ = require('lodash');
const moment = require('moment');
const range = require('moment-range');


function Connector() {

  this.run = function(date, credentials, oneRunner) {
    return new bluebird.Promise((resolve, reject) => {

      bluebird.promisifyAll(oneRunner);
      const logMe = new logMeIn();


      return logMe
      .run(date, credentials, oneRunner)
      .then(() => {
        return oneRunner.gotoAsync('https://www.cic.fr/cic/fr/banque/MMU2_Default.aspx');
      })
      .then(() => {
        return oneRunner.waitForCssAsync({table:'#table2 li:not([class*="sel"]) a[href*="MMU2_LstDoc"]'})
      })
      .then(() => {
        return oneRunner
        .clientSideFunctionAsync('cic', {}, 'gurl')
      })
      .then((url) => {
        return oneRunner.gotoAsync(url)
      })
      .then(() => {
        return oneRunner
        .waitForDownloadAsync('cic',date)
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
      const loginURL = 'https://www.cic.fr';

      return oneRunner
      .gotoAsync(loginURL)
      .then(() => {
        return oneRunner.waitForCssAsync(
          {
            ok:'a[href*="deconnexion"]',
            login:'#e_identifiant',
        })
      })
      .then((ex) => {
        if (ex.ex.login) {
          return oneRunner.typeTextAsync('#e_identifiant', credentials.username)
          .then(() => {
            return oneRunner.typeTextAsync('#e_mdp', credentials.password)
          })
          .then(() => {
            return oneRunner.clickAsync('form[action*="identification"] input[type="submit"]')
          })
          .then(() => {
            return oneRunner.validateLoginAsync({
              login:'div.blocmsg.alerte',
              ok:'a[href*="deconnexion"]',
            }, {})
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
