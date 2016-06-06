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
      .then(( => {
        return oneRunner.gotoAsync('https://monagencepart.edf.fr/ASPFront/appmanager/ASPFront/front?_nfpb=true&page_mes_factures&annee='+date.format('YYYY'));
      }))
      .then(() => {
        return pageReady();
      })
      .then(() => {
        return oneRunner.waitForDownloadAsync('edf', date);
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
      const loginURL = 'https://particulier.edf.fr/fr/accueil/espace-client/tableau-de-bord.html';

      return oneRunner
      .gotoAsync(loginURL)
      .then(() => {
        return oneRunner.waitForCssAsync(
          {
            login:'.isAnonymous.show',
            ok:'#my-dashboard-bloc',
        })
      })
      .then((ex) => {
        if (ex.ex.login) {

          return oneRunner
          .typeTextAsync('#login', credentials.username)
          .then(() => {
            return oneRunner.typeTextAsync('#motdepasse', credentials.password)
          })
          .then(() => {
            return oneRunner.clickAsync('.login_button-role')
          })
          .then(() => {
            return oneRunner.waitForCssAsync({
              login:'#errorLabelAuthentication_',
              ok:'#my-dashboard-bloc'
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
