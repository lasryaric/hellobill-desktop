'use strict';

const bluebird = require('bluebird');
const errors = require('../../errors/errors')
const winston = require('winston');


function GithubConnector() {

  this.run = function(date, credentials, oneRunner) {
    return new bluebird.Promise((resolve, reject) => {
      bluebird.promisifyAll(oneRunner);
      const logMe = new logMeIn();

      return logMe
      .run(date, credentials, oneRunner)
      .then(() => {
        const month = date.format('MM');
        const year = date.format('YYYY');

        return oneRunner.gotoInAppAsync('https://console.aws.amazon.com/billing/home?nc2=h_m_bc#/bill?year='+year+'&month='+month);
      })
      .then(() => {
        return oneRunner.waitForCssAsync('.view-invoices-link', true);
      })
      .then((elementExists) => {
        console.log('aws elementExists?', elementExists)
        if (elementExists.elementExists) {
          return oneRunner.waitForDownloadAsync('awsmain', date);
        } else {
          console.log('we dont have any bill for awsmain date:', date);
        }
      })
      .then(resolve)
      .catch(reject)
    });
  }

  bluebird.promisifyAll(this);

}

function logMeIn() {
  this.run = function(date, credentials, oneRunner) {
    date = null;

    return new bluebird.Promise((resolve, reject) => {
      oneRunner
      .gotoAsync('https://console.aws.amazon.com/billing/')
      .then(() => {

        return oneRunner.waitForCssAsync({signin:'#ap_signin_form', ok:'#nav-usernameMenu'})
      })
      .then((ex) => {
        if (ex.ex.signin) {
          return oneRunner.typeTextAsync('#ap_email', credentials.username)
          .then(() => {
            return oneRunner.typeTextAsync('#ap_password', credentials.password)
          })
          .then(() => {
            return oneRunner.clickAsync('#signInSubmit-input')
          })
          .then(() => {
            return oneRunner.waitForPageAsync();
          })
        }
      })
      .then(() => {
        return oneRunner.validateLoginAsync({error:'#message_error', ok:'#nav-usernameMenu'}, {});
      })
      .then((ex) => {
        if (true === ex.ex.error) {
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
