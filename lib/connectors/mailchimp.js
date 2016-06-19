'use strict';
const winston = require('winston');

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
        return oneRunner.gotoAsync("https://us4.admin.mailchimp.com/account/billing-history/");
      })
      .then(() => {
        return oneRunner.waitForCssAsync('ul.billing-history li:last-child')
      })
      .then(() => {
        return downloadPDFS(date, oneRunner)
      })
      .then(resolve)
      .catch(reject)

    });
  }
}

function downloadPDFS(date, oneRunner) {

  return new Promise((yes, no) => {
    const startURL = oneRunner.getURL();

      return oneRunner
      .clientSideFunctionAsync('mailchimp', date.format("YYYY-MM"), 'getInvoicesURLS')
      .each((url) => {
        return oneRunner
        .gotoAsync(url)
        .then(() => {
          return oneRunner.savePageAsPDFAsync(date)
        })
      })
      .then(() => {
        return oneRunner.gotoAsync(startURL)
      })
      .then(() => {
        return oneRunner
        .waitForCssAsync({'paginationBox':'button[data-dojo-attach-point="nextButton"][style*="display: inline"]', 'end':'button[data-dojo-attach-point="nextButton"][style*="display: none"]'})
      })
      .then((ex) => {

        if (ex.ex.end) {
          yes();
        }
        else if (ex.ex.paginationBox) {
          //const dat = document.querySelector("#billing-history>li.relative.selfclear:last-child .nopadding.small-meta").textContent;
          //const later = moment(date, "YYYY-MM").diff(dat, 'months') > 0;
          //if (later) {
            return oneRunner
            .clickAsync('button[data-dojo-attach-point="nextButton"]')
            .then(() => {
              return oneRunner.waitForPageAsync();
            })
            .then(() => {
              return downloadPDFS(date, oneRunner);
            })
            .then(yes)
          //} else {
          //  yes();
          //}

        }
      })
      .catch(no)
  })
}

function logMeIn() {
  this.run = function(date, credentials, oneRunner) {
    date = null;

    return new bluebird.Promise((resolve, reject) => {
      const loginURL = 'https://us4.admin.mailchimp.com/account/billing-history/';

      return oneRunner
      .gotoAsync(loginURL)
      .then(() => {
        return oneRunner.waitForCssAsync(
          {
            login:'#login',
            ok:'.account-button',
        })
      })
      .then((ex) => {
        if (ex.ex.login) {

          return oneRunner
          .typeTextAsync('#username', credentials.username)
          .then(() => {
            return oneRunner.typeTextAsync('#password', credentials.password)
          })
          .then(() => {
            return oneRunner.clickAsync('#stay-signed-in')
          })
          .then(() => {
            return oneRunner.clickAsync('button[value*="log in"]') //.then(() => { return new Promise(() => {}) })
          })
          .then(() => {
            return oneRunner.waitOnCurrentThreadAsync(3000)
          })
        }
      })
      .then(() => {
        return oneRunner.validateLoginAsync({
          notok: '.feedback-block.error.section',
          ok:'a[data-dojo-attach-point="searchButton"]',
        }, {});
      })
      .then((ex) => {
        if (ex.ex.notok) {
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
