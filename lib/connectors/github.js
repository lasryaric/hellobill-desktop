'use strict';

const bluebird = require('bluebird');
const errors = require('../../errors/errors')
const winston = require('winston');


function GithubConnector() {

  this.run = function(date, credentials, oneRunner, callback) {

    bluebird.promisifyAll(oneRunner);


    oneRunner
    .gotoAsync('https://github.com/')
    .then(() => {

      return oneRunner.elementExistsAsync('body.logged_in')
    })
    .then((elementExists) => {
      winston.info('elementExists? : ', elementExists)
      if (!elementExists.elementExists) {
        return oneRunner.clickAsync(".header-actions .btn[href='/login']")
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
          oneRunner.waitOnCurrentThreadAsync(100)
        })
        .then(() => {
          oneRunner.clickAsync('.auth-form-body input.btn-primary')
        })
        .then(() => {
          return oneRunner.waitForPageAsync();
        })
      }
    })
    .then(() => {
      return oneRunner.elementExistsAsync('body.logged_in')
    })
    .then((ex) => {
      if (ex.elementExists === false) {
        throw new errors.ConnectorErrorWrongCredentials('Wrong credentials for Github');
      }
    })
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
    .then(() => {
      winston.info('after goto url billing');
      callback();
    })
    .catch(callback)
  }

  bluebird.promisifyAll(this);

}


module.exports = GithubConnector;
