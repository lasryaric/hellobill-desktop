'use strict';

const bluebird = require('bluebird');
const errors = require('../../errors/errors')
const _ = require('lodash');
const moment = require('moment');

const googleURLDateFormat = 'YYYYMMDD';

function Connector() {

  this.run = function(date, credentials, oneRunner) {
    return new bluebird.Promise((resolve, reject) => {

      bluebird.promisifyAll(oneRunner);
      const logMe = new logMeIn();


      return logMe
      .run(date, credentials, oneRunner)
      .then(() => {
        return oneRunner.clickAsync('img[src*="img/billing"]')
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
        return oneRunner.waitForCssAsync({iframe: 'iframe[src*="payments"]'})
      })
      .then(() => {
        return oneRunner.getAttributeAsync('iframe[src*="payments"]', 'src');
      })
      .then((iframeSRC) => {

        const dateEnd = date.clone().endOf('month');
        const dateRangeStr = date.format(googleURLDateFormat)+'-'+dateEnd.format(googleURLDateFormat);
        iframeSRC += '&dateRange='+dateRangeStr;
        return oneRunner.gotoAsync(iframeSRC);
      })
      .then(() => {
        return oneRunner.waitForDownloadAsync('google', date);
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
            login:'#Email:not([class*="hidden"])',
            password:'#Passwd:not([class*="hidden"])',
            ok:'img[src*="billing"]',
        })
      })
      .then((ex) => {
        if (ex.ex.ok) {
          return ;
        }
        var emailPromise = null;
        if (ex.ex.login) {
          emailPromise = oneRunner
          .typeTextAsync('#Email', credentials.username)
          .then(() => {
            return oneRunner.clickAsync('#next')
          })
        } else {
          emailPromise = new Promise((y) => {y();});
        }


          return emailPromise
          .then(() => {
            return oneRunner.waitForCssAsync({password:'#Passwd', wrongEmail:'#errormsg_0_Email a'});
          })
          .then((ex) => {
            if (ex.ex.wrongEmail) {
              throw new errors.ConnectorErrorWrongCredentials('Wrong email');
            } else {
                return oneRunner.typeTextAsync('#Passwd', credentials.password)
                .then(() => {
                  return oneRunner.waitForCssAsync({next:'#next', signin:'#signIn'})
                })
                .then((ex) => {
                  if (ex.ex.next) {
                      return oneRunner.clickAsync('#next');
                  } else {
                    return oneRunner.clickAsync('#signIn');
                  }

                })
            }
          })
          .then(() => {
            return oneRunner.validateLoginAsync({wrongPassword:'#errormsg_0_Passwd', ok:'img[src*="billing"]'}, {})
          })
          .then((ex) => {
            if (ex.ex.wrongPassword) {
              throw new errors.ConnectorErrorWrongCredentials('Wrong password');
            }
          })

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
