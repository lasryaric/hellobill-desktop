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
  var theWindow = new BrowserWindow({width: 1024, height: 860, preload: preload, nodeIntegration: false, show:showCrawler,
    "web-preferences": {
      partition:'persist:' + mConnector._id,
      images: true,
    }});
    // theWindow.openDevTools();

    theWindow.loadURL('http://hellobill.io');
    //theWindow.webContents.openDevTools();

    theWindow.on('closed', function() {
      // Dereference the window object, usually you would store windows
      // in an array if your app supports multi windows, this is the time
      // when you should delete the corresponding element.
      winston.info('closing theWindow!');
    });

    theWindow.webContents.on('did-finish-load', function(ax) {



      winston.info('starting __hellobill.runLoop() %s', ax.sender.getURL());
      theWindow.webContents.executeJavaScript("__hellobill.runLoop()");
      theWindow.webContents.session.setDownloadPath(__dirname+'/../downloads/');
      theWindow.canReceiveOrder = true;

    });



    theWindow.webContents.on('will-navigate', function(a, url) {
      winston.info('will navigate %s', url);
      theWindow.canReceiveOrder = false;
    })

    theWindow.webContents.once('did-finish-load', function() {
      lastBrowserWindow = theWindow;
      callback(null, theWindow);
    });
  }

  function getConnectorInstance(name, bw) {
    var instance = null;

    switch (name) {
      case 'github':
      instance = new GithubConnector(bw);
      break;

      case 'skype':
      instance = new SkypeConnector(bw);
      break;

      case 'adobe':
      instance = new AdobeConnector(bw);
      break;

      case 'hellobilltest':
      instance = new HellobilltestConnector(bw);
      break;

      case 'awsmain':
      instance = new Awsmain(bw);
      break;

      case 'uber':
      instance = new UberConnector(bw);
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
    return new Promise(function(resolve, reject) {


      const self = this;

      createBrowserWindowAsync(config)
      .then((bw) => {
        const connector = getConnectorInstance(config.name, bw);
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
        winston.info('Starting runner for %s, %s', config.name, date.format("YYYY-MM"));

        return connector
        .runAsync(date, credentials, oneRunner)
        .then(() => {
          winston.info('All good for %s %s', config.name, date.format("YYYY-MM"))
          onDoneOnce()
        })
        .catch(function(err) {
          if (err.modelConnector === 0) {
            err.modelConnector = config;
          }
          winston.error('calling error method 2 for %s %s', config.name, err)
          onDoneOnce(err);

        }.bind(this))
        .finally(() => {
          oneRunner.cleanup();
          winston.info('Terminating runner for %s, %s', config.name, date.format("YYYY-MM"));
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
