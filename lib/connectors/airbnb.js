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
        return oneRunner.gotoAsync("https://www.airbnb.com/trips")
      })
      .then(() => {
        return oneRunner
        .clientSideFunctionAsync('airbnb',{},'show')
        .each((url) => {
          return oneRunner
          .gotoAsync(url)
          .then(() => {
            return oneRunner
            .waitForCssAsync(
              {
                ok:'.receipt-panel-body-padding',
                notok:'.host-dashboard',
            })
            .then((ex) => {
              if (ex.ex.ok) {
                return oneRunner
                .clientSideFunctionAsync('airbnb', {date: date.format("YYYY-MM")}, 'check')
            }
            })
          })
          .then((result) => {
            if (result) {
              return oneRunner.savePageAsPDFAsync(date)
              .then(() => {
                return oneRunner.gotoAsync(result)
                .then(() => {
                  return oneRunner.savePageAsPDFAsync(date,"/airbnb_fees")
                })
              })
            }
          })
        })
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
      const loginURL = 'https://www.airbnb.com/trips';

      return oneRunner
      .gotoAsync(loginURL)
      .then(() => {
        return oneRunner.waitForCssAsync(
          {
            login:'.signup-login-form__extra-panel-body',
            ok:'a[data-href="/dashboard"].header-avatar-trigger img',
        })
      })
      .then((ex) => {
        if (ex.ex.login) {

          return oneRunner
          .typeTextAsync('#signin_email', credentials.username)
          .then(() => {
            return oneRunner.typeTextAsync('#signin_password', credentials.password)
          })
          .then(() => {
            return oneRunner.clickAsync('#remember_me2')
          })
          .then(() => {
            return oneRunner.clickAsync('#user-login-btn') //.then(() => { return new Promise(() => {}) })
          })
          .then(() => {
            return oneRunner.waitForCssAsync({
              notok1: '#signin_password[autofocus=autofocus]',
              notok2: '.invalid',
              ok:'a[data-href="/dashboard"].header-avatar-trigger'
            })
          })
          .then((ex) => {
            if (ex.ex.notok1 || ex.ex.notok2) {
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
