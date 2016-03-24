'use strict';

const electron = require('electron');
const BrowserWindow = electron.BrowserWindow;
const ipcMain = require('electron').ipcMain;
const GithubConnector = require('./connectors/github');
const SkypeConnector = require('./connectors/skype');
const AdobeConnector = require('./connectors/adobe');
const UberConnector = require('./connectors/uber');
const HellobilltestConnector = require('./connectors/hellobilltest');
const Awsmain = require('./connectors/awsmain');
const Awsiam = require('./connectors/awsiam');
const Amazon = require('./connectors/amazon');
const Amazonfr = require('./connectors/amazonfr');
const Gandi = require('./connectors/gandi');
const BrowserAutomation = require('../BrowserAutomation');
const EventEmitter = require('events');
const util = require('util');
const winston = require('winston');
const moment = require('moment')
const keytar = require('keytar');
const errors = require('../errors/errors.js');

const bluebird = require('bluebird');
const _ = require('lodash');
var lastBrowserWindow = null;

function createBrowserWindow(mConnector, callback) {
  if (lastBrowserWindow) {
    callback(null, lastBrowserWindow);

    return ;
  }
  var preload = __dirname + "/../preload.js";
  winston.info('running preload script:', {preload: preload})
  const showCrawler = process.env.LOADED_FILE === 'production' ? false : true;
  const loadImages = process.env.LOADED_FILE === 'production' ? true : false;
  var theWindow = new BrowserWindow({width: 1024, height: 860, preload: preload, nodeIntegration: false, show:showCrawler,
    "web-preferences": {
      partition:'persist:' + mConnector._id,
      images: true, //loadImages,
    }});
    // theWindow.openDevTools();

    theWindow.loadURL('http://hellobill.io');
    theWindow.webContents.openDevTools();

    theWindow.on('closed', function() {
      // Dereference the window object, usually you would store windows
      // in an array if your app supports multi windows, this is the time
      // when you should delete the corresponding element.
      winston.info('closing theWindow!');
    });

    theWindow.webContents.on('did-finish-load', function(ax) {
      theWindow.webContents.executeJavaScript("__hellobill.runLoop()");
      theWindow.webContents.session.setDownloadPath(__dirname+'/../downloads/');
      theWindow.canReceiveOrder = true;

      ipcMain.once('RunloopStarted', () => {
        winston.info('Runloop ready to process for %s', ax.sender.getURL());
        theWindow.webContents.emit('runloop-ready', ax);

      });

    });

    theWindow.webContents.on('will-navigate', function(a, url) {
      winston.info('will navigate %s', url);
      theWindow.canReceiveOrder = false;
    })

    theWindow.webContents.once('runloop-ready', function() {
      lastBrowserWindow = theWindow;
      callback(null, theWindow);
    });
  }

  function getConnectorInstance(name, bw, component) {
    var instance = null;
    component = component || 'billFetcher';

    switch (name) {
      case 'github':
      instance = GithubConnector;
      break;

      case 'skype':
      instance = SkypeConnector;
      break;

      case 'adobe':
      instance = AdobeConnector;
      break;

      case 'hellobilltest':
      instance = new HellobilltestConnector(bw);
      break;

      case 'awsmain':
      instance = Awsmain;
      break;

      case 'awsiam':
      instance = Awsiam;
      break;

      case 'amazon':
      instance = Amazon;
      break;

      case 'amazonfr':
      instance = Amazonfr;
      break;

      case 'gandi':
      instance = Gandi;
      break;

      case 'uber':
      instance = UberConnector;
      break;

      default:
      throw Error("No connector found with the name : "+ name);
    }

    return instance;
  }

  function closeBrowserWindow() {
    return new Promise(function (yes, no) {
      if (lastBrowserWindow === null) {
        yes();

        return ;
      }
      lastBrowserWindow.removeAllListeners();
      lastBrowserWindow.close();
      lastBrowserWindow = null;
      yes();
    })
  }

  function runIt(mUserMe, config, date) {
    return new bluebird.Promise(function(resolve, reject) {


      const self = this;

      createBrowserWindowAsync(config)
      .then((bw) => {
        const runnerType = date ? 'billFetcher' : 'logMeIn';
        const connector = new (getConnectorInstance(config.name, bw)[runnerType]);
        const oneRunner = new BrowserAutomation(bw, config.name, mUserMe.destinationFolder, config);

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

        const serializedCredentials = keytar.getPassword('hellobil_desktopapp', config._id);
        if (!serializedCredentials) {
          const errCredentials = new errors.ConnectorErrorCredentialsNotFound("Credentials not found for "+config.name);
          errCredentials.modelConnector = {_id: config._id, name: config.name};
          onDoneOnce(errCredentials);

          return ;
        }
        const credentials = JSON.parse(serializedCredentials);
        // winston.info('Starting runner for %s, %s', config.name, date.format("YYYY-MM"));

        winston.info('starting %s', config.name)
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
          winston.info('ending %s', config.name)
          oneRunner.cleanup();
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
