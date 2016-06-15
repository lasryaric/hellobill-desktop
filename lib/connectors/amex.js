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
        return oneRunner
        .waitForCssAsync({pdf:'a[href*="pdfstmt"].btnCenterBackground',account:'#lbxAccountSummary',invoice:'.orderprev .pdf_statement'})
      })
      .then((ex) => {
        if (ex.ex.account) {
          return oneRunner.clientSideFunctionAsync('amex', {}, 'gurl')
          .then((url) => {
            return oneRunner.gotoAsync(url)
          })
          .then(() => {
            return oneRunner.waitForCssAsync({pdf:'a[href*="pdfstmt"].btnCenterBackground'})
          })
          .then(() => {
            return oneRunner.clickAsync('a[href*="pdfstmt"].btnCenterBackground')
          })
        } else if (ex.ex.pdf) {
          return oneRunner.clickAsync('a[href*="pdfstmt"].btnCenterBackground')
        }
      })
      .then(() => {
        return oneRunner.waitForDownloadAsync('amex',date)
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
      const loginURL = 'https://global.americanexpress.com';

      return oneRunner
      .gotoAsync(loginURL)
      .then(() => {
        return oneRunner.waitForCssAsync(
          {
            login:'#mmLoginBtn',
            ok:'a[href*="logout"]',
            user: '#Username',
            account:'#lbxAccountSummary',
        })
      })
      .then((ex) => {
        if (ex.ex.login) {
          return oneRunner
          .clickAsync('#mmLoginBtn')
          .then(() => {
            return oneRunner.waitForCssAsync({user:'#Username'})
          })
          .then(() => {
            return oneRunner.typeTextAsync('#Username', credentials.username)
          })
          .then(() => {
            return oneRunner.typeTextAsync('#Password', credentials.password)
          })
          .then(() => {
            return oneRunner.clickAsync('#checkBox')
          })
          .then(() => {
            return oneRunner.clickAsync('#loginLink') //.then(() => { return new Promise(() => {}) })
          })
          .then(() => {
            return oneRunner.waitForCssAsync({
              notok: '.input-error',
              ok:'a[href*="logout"]',
              cookie:'#euc_dialog',
              account:'#lbxAccountSummary',
            })
          })
          .then((ex) => {
            if (ex.ex.notok) {
              throw new errors.ConnectorErrorWrongCredentials('Wrong credentials');
            }
          })
        }
        if (ex.ex.user) {
          return oneRunner
          .typeTextAsync('#Username', credentials.username)
          .then(() => {
            return oneRunner.typeTextAsync('#Password', credentials.password)
          })
          .then(() => {
            return oneRunner.clickAsync('#checkBox')
          })
          .then(() => {
            return oneRunner.clickAsync('a#loginLink') //.then(() => { return new Promise(() => {}) })
          })
          .then(() => {
            return oneRunner.waitForCssAsync({
              notok: '.input-error',
              ok:'a[href*="logout"]',
              cookie:'#euc_dialog',
              account:'#lbxAccountSummary',
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
