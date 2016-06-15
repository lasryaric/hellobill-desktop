'use strict';

const bluebird = require('bluebird');
const errors = require('../../errors/errors')
const winston = require('winston');


function GithubConnector() {

  this.run = function(date, credentials, oneRunner, callback) {

    const logMe = new logMeIn();
    bluebird.promisifyAll(oneRunner);
    return new bluebird.Promise((resolve, reject) => {



      return logMe
      .run(date, credentials, oneRunner)
      .then(() => {
        return oneRunner.gotoAsync('https://github.com/settings/billing')
      })
      .then(() => {
        // return oneRunner.clickAsync('td.receipt a')
        return oneRunner.getInnerHTMLAsync('.org-settings-link')
      })
      .then((organizations) => {
        const pairs = organizations.map((org) => {
          const url = "https://github.com/organizations/"+org+"/settings/billing";

          return { url: url, org: org};
        });
        //urls.push('https://github.com/settings/billing');
        pairs.push({url: 'https://github.com/settings/billing', org:'personal'})

        return pairs;
      })
      .each((pair) => {
        return oneRunner.gotoAsync(pair.url)
        .then(() => {
          return oneRunner.waitForDownloadAsync('github', date);
        })
      })
      .then(resolve)
      .catch(reject)
    })
  }

  bluebird.promisifyAll(this);

}

function logMeIn() {
  this.run = function(date, credentials, oneRunner) {
    date = null;

    return new bluebird.Promise((resolve, reject) => {
      oneRunner
      .gotoAsync('https://github.com/')
      .then(() => {

        return oneRunner.elementExistsAsync('body.logged-in')
      })
      .then((elementExists) => {
        winston.info('elementExists? : ', elementExists)
        if (!elementExists.elementExists) {
          return oneRunner.clickAsync(".btn[href='/login']")
          .then(() => {
            return oneRunner.waitForPageAsync()
          })
          .then(() => {
            return oneRunner.typeTextAsync('#login_field', credentials.username)
          })
          .then(() => {
            return oneRunner.typeTextAsync('#password', credentials.password)
          })
          .then(() => {
            return oneRunner.waitOnCurrentThreadAsync(100)
          })
          .then(() => {
            return oneRunner.clickAsync('.auth-form-body input.btn-primary')
          })
          .then(() => {
            return oneRunner.waitForPageAsync();
          })
        }
      })
      .then(() => {
        return oneRunner.validateLoginAsync({ok:'body.logged-in', loginError:'.flash.flash-full.flash-error'}, {'twostep': 'form[action="/sessions/two-factor"]'});
      })
      .then((ex) => {
        if (ex.ex.loginError === true) {
          throw new errors.ConnectorErrorWrongCredentials('Wrong credentials');
        }
      })
      .then(resolve)
      .catch(reject)

    })
  }
}


exports.billFetcher = GithubConnector;
exports.logMeIn = logMeIn;
