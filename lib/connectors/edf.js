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
        return oneRunner.gotoAsync('https://particulier.edf.fr/bin/edf_rc/servlets/edfSasServlet?service=page_mes_factures');
      })
      .then(() => {
        return oneRunner.waitForCssAsync({
          previous: 'ul.years a[title*="'+date.add('-1', 'years').format('YYYY')+'"]',
          current: 'ul.years a[title*="'+date.format('YYYY')+'"]', //current year
          next: 'ul.years a[title*="'+date.add('+1', 'years').format('YYYY')+'"]',
        })
      })
      .then((ex) => {
        if ((ex.ex.previous || ex.ex.next) && !ex.ex.current) {
          return oneRunner.clickAsync('ul.years a[title*="'+date.format('YYYY')+'"]')
        }
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
            login:'.pure-g.login_gray',
            ok1:'#my-dashboard-bloc',
            ok2:'#facturesConsoTpl',
        })
      })
      .then((ex) => {
        if (ex.ex.login) {

          return oneRunner
          .typeTextAsync('#login_login_plain', credentials.username)
          .then(() => {
            return oneRunner.typeTextAsync('#password_login_plain', credentials.password)
          })
          .then(() => {
            return oneRunner.clickAsync('#rememberMe_login_plain')
          })
          .then(() => {
            return oneRunner.clickAsync('.login_connectButton') //.then(() => { return new Promise(() => {}) })
          })
          .then(() => {
            return oneRunner.validateLoginAsync({
              notok1: '.error-message.invalidFormat.invalidFormatCo:not([style*="none"])',
              notok2: '.error-message.invalidPwd:not([style*="none"])',
              notok3: '.errorLabel.errorLabelAuthentication.error-message:not([style*="none"])',
              ok:'#my-dashboard-bloc',
            }, {})
          })
          .then((ex) => {
            if (ex.ex.notok1 || ex.ex.notok2 || ex.ex.notok3) {
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
