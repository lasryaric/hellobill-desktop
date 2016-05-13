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
         return oneRunner.gotoAsync('https://admin.google.com/hellobill.io/AdminHome?fral=1#DomainSettings/notab=1&subtab=subscriptions')
      })
      .then(() => {
        return oneRunner.waitForCssAsync({popinButton:'.singleSubscriptionHeaderRight .cbarToggleButton'})
      })
      .then(() => {
        return oneRunner.clickRealAsync('.singleSubscriptionHeaderRight .cbarToggleButton');
      })
      .then(() => {
        return oneRunner.clickAsync('.popupContent div[role="menu"] div');
      })
      .then(() => {
        return oneRunner.waitOnCurrentThreadAsync(100000000);
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
      const loginURL = 'https://admin.google.com/';

      return oneRunner
      .gotoAsync(loginURL)
      .then(() => {
        return oneRunner.waitForCssAsync(
          {
            login:'#Email',
            ok:'img[src*="billing"]',
        })
      })
      .then((ex) => {
        if (ex.ex.login) {

          return oneRunner
          .typeTextAsync('#Email', credentials.username)
          .then(() => {
            return oneRunner.clickAsync('#next')
          })
          .then(() => {
            return oneRunner.waitForCssAsync({password:'#Passwd', wrongEmail:'#errormsg_0_Email a'});
          })
          .then((ex) => {
            if (ex.ex.wrongEmail) {
              throw new errors.ConnectorErrorWrongCredentials('Wrong email');
            } else {
                return oneRunner.typeTextAsync('#Passwd', credentials.password)
                .then(() => {
                  return oneRunner.clickAsync('#next');
                })
            }
          })
          .then(() => {
            return oneRunner.waitForCssAsync({wrongPassword:'#errormsg_0_Passwd', ok:'img[src*="billing"]'})
          })
          .then((ex) => {
            if (ex.ex.wrongPassword) {
              throw new errors.ConnectorErrorWrongCredentials('Wrong password');
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
