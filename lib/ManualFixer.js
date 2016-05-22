'use strict';

const electron = require('electron');
const AppConstants = require('./constants/AppConstants');
const BrowserWindow = electron.BrowserWindow;
const winston = require('winston');
const ipcMain = require('electron').ipcMain;

function getURL(mConnector, credentials) {
  var name2connector = {
    adobe: "https://accounts.adobe.com/orders",
    amazon: "https://www.amazon.com/gp/css/order-history/ref=nav_youraccount_orders",
    amazonfr: "https://www.amazon.fr/gp/css/order-history/ref=nav_youraccount_orders",
    awsiam: `https://${credentials.account}.signin.aws.amazon.com/console`,
    awsmain: 'https://console.aws.amazon.com/billing/',
    bouygues: 'http://www.bouyguestelecom.fr/mon-compte/',
    dropbox: 'https://www.dropbox.com',
    facebookads: 'https://www.facebook.com/',
    gandi: 'https://www.gandi.net/admin/billing/invoices?filter.~invoice_num=&filter.%3Edate=&filter.%3Cdate=&perpage=500&page=0',
    github: 'https://github.com/settings/billing',
    ovh: 'https://www.ovh.com/cgi-bin/gotomanager.cgi',
    skype: 'https://go.skype.com/myaccount',
    slack: `https://${credentials.team}.slack.com/admin/billing/`,
    uber: 'https://riders.uber.com/trips',
  }

  return name2connector[mConnector.get('name')];
}

class ManualFixer {
  constructor(mConnector, credentials) {
    this.mConnector = mConnector;
    this.credentials = credentials;
    this.theWindow = null;
  }

  start() {
    winston.info("Manual fixer started for %s", this.mConnector.get('name'))
    var self = this;
    const partition = 'persist:' + this.mConnector.get('_id');

    this.theWindow = new BrowserWindow({
      width: 1024,
      height: 860,
      show:true,
      "webPreferences": {
        images: true, //loadImages,
        nodeIntegration: true,
      }
    });
    const url = getURL(this.mConnector, this.credentials);
    const bootstrapURL = process.env.WEBAPP_STARTING_POINT + '/desktop/'+AppConstants.webVersion+'/app/manualfixer';

    if (process.env.LOADED_FILE !== 'production') {
        this.theWindow.webContents.openDevTools();
    }
    ipcMain.on('ManualFixerComponentReady', function() {
      winston.info("Just received ManualFixerComponentReady");
      setTimeout(function() {
        self.theWindow.webContents.send('ManualFixerStart', { partition: partition, url:url})
      }.bind(this), 0)
    }.bind(this))

    this.theWindow.loadURL(bootstrapURL);
  }

  end() {
    winston.info("Manual fixer ended for %s", this.mConnector.get('name'))
    this.theWindow.removeAllListeners();
    this.theWindow.close();
    this.theWindow = null;
  }
}

module.exports = ManualFixer;
