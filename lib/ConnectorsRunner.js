'use strict';

const electron = require('electron');
const BrowserWindow = electron.BrowserWindow;
const ipcMain = require('electron').ipcMain;

const BrowserAutomation = require('../BrowserAutomation');
const EventEmitter = require('events');
const util = require('util');
const winston = require('winston');
const keytar = require('keytar');
const errors = require('../errors/errors.js');

const bluebird = require('bluebird');
const _ = require('lodash');
var lastBrowserWindow = null;
var connectorName2BrowserWindow = {};
var windowsIDClosed = {};

ipcMain.on('RunloopStarted', (event, a, b, c) => {
  if (event.sender.listenerCount('RunloopStarted') > 0) {
    event.sender.emit('RunloopStarted', event, a, b, c);
    event.returnValue = true;
  }
});

var rendererMessage = null;
global.getRendererMessage = function() {
  console.log('********* returning: ', rendererMessage);
  return rendererMessage;
}

global.saveRendererMessage = function(message) {
  console.log('********* setting rendererMessage: ', message);
  rendererMessage = message;
}

global.removeRendererMessage = function() {
  console.log('********* removing rendererMessage: ', rendererMessage);
  rendererMessage = null;
}


function createBrowserWindow(mConnector, callback) {
  if (connectorName2BrowserWindow[mConnector.name]) {
    callback(null, connectorName2BrowserWindow[mConnector.name]);

    return ;
  }
  var preload = __dirname + "/../preload.js";
  winston.info('running preload script:', {preload: preload})
  const showCrawler = process.env.LOADED_FILE === 'production' ? false : true;
  var theWindow = new BrowserWindow({width: 1024, height: 860, show:showCrawler,
    "webPreferences": {
      partition:'persist:' + mConnector._id,
      images: true, //loadImages,
      nodeIntegration: false,
      preload: preload,
      webSecurity: false,
    }});
    theWindow.webContents.on('new-window', function(event, url, frameName, disposition, options) {
      options.show = false;
    })
    theWindow.webContents.session.webRequest.onBeforeSendHeaders(['*'], (details, callback) => {

      details.requestHeaders['Connection'] = 'close'
      callback({cancel: false, requestHeaders: details.requestHeaders})
    })

    theWindow.webContents.on('crashed', () => {
      winston.error('The crawler crashed... for: %s', mConnector.name)
    })

    theWindow.webContents.session.on('will-download', function(event) {
      winston.info("!!!!!!!!!! - Preventing default download window")
      event.preventDefault();
    })

    theWindow.loadURL(process.env.WEBAPP_STARTING_POINT + '/desktop/bootstrap');
    if (process.env.LOADED_FILE !== 'production') {
      theWindow.webContents.openDevTools();
    }


    theWindow.webContents.on('RunloopStarted', (ax) => {
      winston.info('3(done). Runloop ready to process for %s', ax.sender.getURL());
      theWindow.webContents.emit('runloop-ready', ax);
    });

    theWindow.webContents.on('will-navigate', function(a, url) {
      winston.info('1. will navigate %s', url);
      theWindow.canReceiveOrder = false;
    })

    theWindow.webContents.once('runloop-ready', function() {
      connectorName2BrowserWindow[mConnector.name] = theWindow;
      callback(null, theWindow);
    });
  }

  function getConnectorInstance(name) {
    return require('./connectors/' + name);
  }

  function closeBrowserWindow(mConnector) {
    rendererMessage = null;
    return new Promise(function (yes, no) {
      if (connectorName2BrowserWindow[mConnector.name] === null) {
        yes();

        return ;
      }
      const winID = connectorName2BrowserWindow[mConnector.name].id;
      if (windowsIDClosed[winID]) {
        winston.error('OWAW!! We already closed this window ID:', {winID:winID, connector:mConnector});
      }
      windowsIDClosed[winID] = true;
      console.log('windowsIDClosed:', windowsIDClosed);
      // connectorName2BrowserWindow[mConnector.name].webContents.removeAllListeners();
      // connectorName2BrowserWindow[mConnector.name].webContents.session.removeAllListeners();
      // connectorName2BrowserWindow[mConnector.name].removeAllListeners();
      connectorName2BrowserWindow[mConnector.name].close();
      connectorName2BrowserWindow[mConnector.name] = null;
      yes();
    })
  }

  function runIt(mUserMe, config, date) {
    const dateStrOptinal = date ? date.format('YYYY-MM') : 'unknown';
    return new bluebird.Promise(function(resolve, reject) {


      const self = this;

      createBrowserWindowAsync(config)
      .then((bw) => {
        var credentials = null;
        if (!config.credentials) {
          const serializedCredentials = keytar.getPassword('hellobil_desktopapp', config._id);
          if (!serializedCredentials) {
            const errCredentials = new errors.ConnectorErrorCredentialsNotFound("Credentials not found for "+config.name);
            errCredentials.modelConnector = {_id: config._id, name: config.name};
            onDoneOnce(errCredentials);

            return ;
          }
          credentials = JSON.parse(serializedCredentials);
        } else {
          credentials = config.credentials;
        }

        const runnerType = date ? 'billFetcher' : 'logMeIn';
        const twoSSPopupMessage = true; //!!date;
        const connector = new (getConnectorInstance(config.name)[runnerType]);
        const oneRunner = new BrowserAutomation(bw, config.name, mUserMe.destinationFolder, mUserMe.email, credentials.username, config, twoSSPopupMessage);

        function onDone(err) {
          oneRunner.setIsClosing();

          bw = null;
          if (err) {
            reject(err)
          } else {
            resolve();
          }
        }
        const onDoneOnce = _.once(onDone.bind(this));

        oneRunner.emitter.on('fileDownloaded', (data) => {
          self.emit('fileDownloaded', data);
        })
        // winston.info('Starting runner for %s, %s', config.name, date.format("YYYY-MM"));

        winston.info('starting %s / %s', config.name, dateStrOptinal)
        return connector
        .run(date, credentials, oneRunner)
        .then(() => {
          // winston.info('All good for %s %s', config.name, date.format("YYYY-MM"))
          onDoneOnce()
        })
        .catch(function(err) {
          if (err.modelConnector === 0) {
            err.modelConnector = config;
          }
          winston.error('calling error method 2 for %s %s %s', config.name, err, err.stack)
          onDoneOnce(err);

        }.bind(this))
        .finally(() => {
          winston.info('ending %s / %s', config.name, dateStrOptinal)
          // winston.info('Terminating runner for %s, %s', config.name, date.format("YYYY-MM"));
        })
      })
    }.bind(this));
  }


  var createBrowserWindowAsync = bluebird.promisify(createBrowserWindow);
  // util.inherits(runThem, EventEmitter);

  function runner() {
    EventEmitter.call(this);

    this.runIt = runIt.bind(this);
    this.closeBrowserWindow = closeBrowserWindow.bind(this);
    this.iam = 'connectorRuner.runner';



  }
  util.inherits(runner, EventEmitter);

  module.exports = runner;
