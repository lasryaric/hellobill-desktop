'use strict';

const bluebird = require('bluebird');
const errors = require('../../errors/errors')
const _ = require('lodash');
const moment = require('moment');
const winston = require('winston');


function Connector() {

  this.run = function(date, credentials, oneRunner) {
    return new bluebird.Promise((resolve, reject) => {

      bluebird.promisifyAll(oneRunner);
      const logMe = new logMeIn();


      return logMe
      .run(date, credentials, oneRunner)
      .then(() => {
        return oneRunner.gotoAsync('https://mon.urssaf.fr/tldp_archi')
      })
      .then(() => {
        return oneRunner
        .clientSideFunctionAsync('urssaf', {date:date.format("YYYY-MM")}, 'getInvoicesURLS')
      })
      .each((url) => {
        return oneRunner.gotoAsync(url)
        .then(() => {
          return oneRunner.savePageAsPDFAsync(date)
        })
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
      const loginURL = 'https://www.urssaf.fr/portail/home/services-en-ligne.html';

      return oneRunner
      .gotoAsync(loginURL)
      .then(() => {
        return oneRunner.waitForCssAsync(
          {
            login:'input.Siret',
            ok:'img[src="/images/disconect_button.png"]',
        })
      })
      .then((ex) => {
        if (ex.ex.login) {

          return oneRunner
          .typeTextAsync('input.Siret', credentials.username)
          .then(() => {
            return oneRunner.typeTextAsync('input.Mdp', credentials.password)
          })
          .then(() => {
            return oneRunner.clickAsync('input.loginBouton') //.then(() => { return new Promise(() => {}) })
          })
          .then(() => {
            return oneRunner.waitForCssAsync({
              notok: 'input[value="Valider"]', //appears if the credentials are wrong
              ok:'img[src="/images/disconect_button.png"]',
            })
          })
          .then((ex) => {
            if (ex.ex.notok) {
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
