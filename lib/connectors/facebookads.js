'use strict';

const bluebird = require('bluebird');
const errors = require('../../errors/errors')
const _ = require('lodash');
const url = require('url');


function Connector() {
  const facebookURLDateFormat = 'YYYY-MM-DD';

  this.run = function(date, credentials, oneRunner) {
    return new bluebird.Promise((resolve, reject) => {

      bluebird.promisifyAll(oneRunner);
      const logMe = new logMeIn();


      return logMe
      .run(date, credentials, oneRunner)
      .then(() => {
        return oneRunner.gotoAsync('https://www.facebook.com/ads/manager/accounts/')
      })
      .then(() => {
        return oneRunner
        .getAttributeAsync('a[href*="/ads/manage/campaigns/"]', 'href');
      })
      .each((accountURL) => {
        const urlProps = url.parse(accountURL, true);
        if (urlProps && urlProps.query && urlProps.query.act) {
          const act = urlProps.query.act;
          const dateEnd = date.clone().endOf('month');
          const dateRangeStr = date.format(facebookURLDateFormat)+'_'+dateEnd.format(facebookURLDateFormat);
          const invoicesURL = 'https://www.facebook.com/ads/manager/billing/transactions/?act='+act+'&pid=p2&date='+dateRangeStr;

          return oneRunner.gotoAsync(invoicesURL)
          .then(() => {
            return oneRunner
            .waitForDownloadAsync('facebookads', date);
          })
        }
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

      return oneRunner
      .gotoAsync('https://www.facebook.com/')
      .then(() => {
        return oneRunner.waitForCssAsync({login:'#login_form', ok:'input[name="q"]'})
      })
      .then((ex) => {
        if (ex.ex.login) {
          return oneRunner
          .typeTextAsync('#email', credentials.username)
          .then(() => {
            return oneRunner.typeTextAsync('#pass', credentials.password)
          })
          .then(() => {
            return oneRunner.clickAsync('#login_form input[type="submit"]')
          })
          .then(() => {
            return oneRunner.waitForPageAsync();
          })
        }
      })
      .then(() => {
        return oneRunner.validateLoginAsync({login:'#login_form', ok:'input[name="q"]'}, {})
      })
      .then((ex) => {
        if (ex.ex.login) {
          throw new errors.ConnectorErrorWrongCredentials('Wrong credentials for Facebook Ads');
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
