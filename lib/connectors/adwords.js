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
         return oneRunner.clickAsync('#aw-cues-gearicon')
       })
      .then(() => {
        return oneRunner.waitForCssAsync({popinButton:'.aw-cues-item-base-link.aw-cues-item-link[href*="Billing"]'})
      })
      .then(() => {
        return oneRunner.clickAsync('.aw-cues-item-base-link.aw-cues-item-link[href*="Billing"]');
      })
      .then(() => {
        return oneRunner.waitForCssAsync('iframe#paymentsIframeContainerIframe');
      })
      .then(() => {
        return oneRunner.getAttributeAsync('iframe#paymentsIframeContainerIframe', 'src');
      })
      .then((src) => {
          src += '&dateRange=ALL_TIME';
          return oneRunner.gotoAsync(src);
      })
      .then(() => {
        return oneRunner.waitForDownloadAsync('adwords', date);
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
      const loginURL = 'http://www.google.com/adwords/';

      return oneRunner
      .gotoAsync(loginURL)
      .then(() => {
        return oneRunner.clickAsync('a[data-custom="ads-signin-link"]')
      })
      .then(() => {
        return oneRunner.waitForCssAsync(
          {
            email:'#Email',
            ok1:'a[title*="Google apps"]',
            ok2: '#aw-cues-gearicon',
        })
      })
      .then((ex) => {
        if (ex.ex.email) {

          return oneRunner
          .typeTextAsync('#Email', credentials.username)
          .then(() => {
            return oneRunner.clickAsync('#next')
          })
          .then(() => {
            return oneRunner.waitForCssAsync({password:'#Passwd', wrongEmail:'.card-mask-wrap.no-name.has-error[style*="transform"]'});
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
            return oneRunner.waitForCssAsync({wrongPassword:'#errormsg_0_Passwd', ok:'.aw-cues-customerpanel'})
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
