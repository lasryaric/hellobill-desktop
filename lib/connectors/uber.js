'use strict';

const bluebird = require('bluebird');
const errors = require('../../errors/errors')
const _ = require('lodash');


function GithubConnector() {

  this.run = function(date, credentials, oneRunner) {
    return new bluebird.Promise((resolve, reject) => {
      bluebird.promisifyAll(oneRunner);
      const logMe = new logMeIn();


      return logMe
      .run(date, credentials, oneRunner)
      .then(() => {
        const url = "https://riders.uber.com/trips?month="+date.format("YYYY-MM");

        return oneRunner.gotoAsync(url);
      })
      .then(() => {
        return oneRunner.elementExistsAsync('.trip-expand__arrow')
      })
      .then((ex) => {
        if (ex.elementExists) {
          //close the first bill which is opened by default
          return oneRunner.clickAsync('.trip-expand__arrow')
          .then(() => {
            //expand them all
            return oneRunner.clickAllAsync('.trip-expand__arrow')
          })
          .then(() => {
            return oneRunner.getAttributeAsync('.trip-expand.trip-expand--completed a[href^="/trip"]', 'href')
          })
          .then((hrefs) => {
            return _.uniq(hrefs);
          })
          .each((href) => {
            return oneRunner
            .gotoAsync(href)
            .then(() => {
              return oneRunner.waitForCssAsync({
                download: '#data-invoice-btn-download:not([class*="hidden"])',
                pdf: '#data-invoice-btn-download'
              })
            })
            .then((ex) => {
              return oneRunner
              .getInnerHTMLAsync('.soft-half--sides')
              .then((cardDirty) => {
                var cardClean = null;
                if (cardDirty.length === 1) {
                    if (cardDity.length>5) {
                      cardClean = 'Paypal';
                    } else {
                      cardClean = 'CB '+cardDirty[0].substr(-4);
                    }
                }
                if (ex.ex.download) {
                  return oneRunner
                  .waitForCssAsync('#data-invoice-btn-download:not([class*="hidden"])', true)
                  .then(() => {
                    return oneRunner.waitOnCurrentThreadAsync(1000);
                  })
                  .then(() => {
                    return oneRunner.waitForDownloadAsync('uber', date, cardClean)
                  })

                } else {
                  return oneRunner.savePageAsPDFAsync(date, cardClean);
                }
              })
            })
          })
          .then(() => {
            return resolve();
          })
        } else {
          return resolve();
        }
      })
      .catch(reject)
    });
  }
}

function logMeIn() {
  this.run = function(date, credentials, oneRunner) {
    date = null;

    return new bluebird.Promise((resolve, reject) => {

      return oneRunner
      .gotoAsync('https://riders.uber.com/trips')
      .then(() => {
        return oneRunner.elementExistsAsync('#email');
      })
      .then((ex) => {
        if (ex.elementExists) {
          return oneRunner
          .typeTextAsync('#email', credentials.username)
          .then(() => {
            return oneRunner.typeTextAsync('#password', credentials.password)
          })
          .then(() => {
            return oneRunner.clickAsync('#login-form button[type="submit"]')
          })
          .then(() => {
            return oneRunner.waitForPageAsync();
          })
        }
      })
      .then(() => {
        return oneRunner.validateLoginAsync({notok:'#email', ok:'.trip-expand__arrow'}, {})
      })
      .then((ex) => {
        if (ex.ex.notok) {
          throw new errors.ConnectorErrorWrongCredentials('Wrong credentials for Uber');
        }
      })
      .then(() => {
        resolve();
      })
      .catch(reject);
    })

  }
}


exports.billFetcher = GithubConnector;
exports.logMeIn = logMeIn;
