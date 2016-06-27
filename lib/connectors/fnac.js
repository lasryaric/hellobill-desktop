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
        return logIn(date,credentials,oneRunner);
      })
      .then(() => {
        return oneRunner.waitForCssAsync({table:'table.tabCommandes'})
      })
      .then(() => {
        return oneRunner.clientSideFunctionAsync('fnac',{date:date.format("YYYY-MM")},'getLinks')
        .each((link) => {
          return oneRunner.gotoAsync(link)
          .then(() => {
            return oneRunner.waitForCssAsync({dates:'li.dateEmission'})
          })
          .then(() => {
            return oneRunner.savePageAsPDFAsync(date)
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
      const loginURL = 'https://secure.fnac.com/MyAccount/Order';

      return oneRunner
      .gotoAsync(loginURL)
      .then(() => {
        return oneRunner.waitForCssAsync(
          {
            login:'#LogonAccountSteamRollPlaceHolder_ctl00_txtEmail',
            ok:'a[href*="/Account/Profil/AccountInfos.aspx"]',
        })
      })
      .then((ex) => {
        if (ex.ex.login) {
          return oneRunner.typeTextAsync('#LogonAccountSteamRollPlaceHolder_ctl00_txtEmail', credentials.username)
          .then(() => {
            return oneRunner.typeTextAsync('#LogonAccountSteamRollPlaceHolder_ctl00_txtPassword', credentials.password)
          })
          .then(() => {
            return oneRunner.clickAsync('#LogonAccountSteamRollPlaceHolder_ctl00_btnPoursuivre')
          })
        }
      })
      .then(() => {
        return oneRunner.waitOnCurrentThreadAsync(3000)
      })
      .then(() => {
        return oneRunner.validateLoginAsync({
          login:'#LogonAccountSteamRollPlaceHolder_ctl00_valLogon div.ma-Alert',
          ok:'a[href*="/Account/Profil/AccountInfos.aspx"]',
        }, null)
      })
      .then((ex) => {
        if (ex.ex.login) {
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

function logIn(date, credentials, oneRunner) {

    return new bluebird.Promise((resolve, reject) => {
      const loginURL = 'https://www.fnacspectacles.com/compteclient/commandes.do';

      return oneRunner
      .gotoAsync(loginURL)
      .then(() => {
        return oneRunner.waitForCssAsync(
          {
            login:'#Fnac_Useremail',
            ok:'table.tabCommandes',
        })
      })
      .then((ex) => {
        if (ex.ex.login) {
          return oneRunner.typeTextAsync('#Fnac_Useremail', credentials.username)
          .then(() => {
            return oneRunner.typeTextAsync('#Fnac_UserPassword', credentials.password)
          })
          .then(() => {
            return oneRunner.clickAsync('input.inputPoursuivre')
          })
        }
      })
      .then(() => {
        return oneRunner.waitOnCurrentThreadAsync(3000)
      })
      .then(() => {
        return oneRunner.validateLoginAsync({
          login:'span.messageErreur',
          ok:'table.tabCommandes',
        }, null)
      })
      .then((ex) => {
        if (ex.ex.login) {
          throw new errors.ConnectorErrorWrongCredentials('Wrong credentials');
        }
      })
      .then(() => {
        resolve();
      })
      .catch(reject);
    })
}


exports.billFetcher = Connector;
exports.logMeIn = logMeIn;
