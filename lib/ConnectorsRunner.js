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
const mainRunner = require('../BrowserAutomation');
const EventEmitter = require('events');
const util = require('util');
const winston = require('winston');
const moment = require('moment')
const keytar = require('keytar');
const errors = require('../errors/errors.js');

const bluebird = require('bluebird');
const _ = require('lodash');

function createBrowserWindow(mConnector, callback) {
  var preload = __dirname + "/../preload.js";
  winston.info('running preload script:', {preload: preload})
  const showCrawler = process.env.LOADED_FILE === 'production' ? false : true;
  var theWindow = new BrowserWindow({width: 1024, height: 860, preload: preload, nodeIntegration: false, show:showCrawler,
    "web-preferences": {
      partition:'persist:' + mConnector._id,
      images: false,
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


  function runIt(mUserMe, config, date, callback) {

    const self = this;


    createBrowserWindowAsync(config)
    .then((bw) => {
      const connector = getConnectorInstance(config.name, bw);
      const oneRunner = new mainRunner(bw, config.name, mUserMe.destinationFolder, config);

      function onDone(err) {
        oneRunner.setIsClosing();
        callback(err);
        bw.close();
        bw = null;
      }
      const onDoneOnce = _.once(onDone.bind(this));

      oneRunner.emitter.on('error', (err) => {
        if (err.modelConnector === 0) {
          err.modelConnector = {_id: config._id, name: config.name};
        }
        winston.error('calling error method 1 for %s error: %s message: %s', config.name, err.name, err.message);
        onDoneOnce(err)
      })

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
        // oneRunner.setIsClosing();
        // callback();
        // bw.close();
        // bw = null;
        onDoneOnce()
      })
      .catch(function(err) {
        if (err.modelConnector === 0) {
          err.modelConnector = config;
        }
        // callback(err);
        // oneRunner.setIsClosing();
        // bw.close();
        // bw = null;
        winston.error('calling error method 2 for %s %s', config.name, err)
        onDoneOnce(err);

      }.bind(this))
      .finally(() => {
        winston.info('Terminating runner for %s, %s', config.name, date.format("YYYY-MM"));
      })
    })
  }

  function runThem(mUserMe, list, date, updaterCallback, callback) {

    if (list.size === 0) {
      winston.info('runThem: all done!');
      callback();

      return ;
    }
    const self = this;


    const config = list.get(0).toJS();
    list = list.shift();
    if (!this.emit) {
      winston.error('I have a wrong emit');
      console.trace();
    }
    const monthBegin = moment(moment().format("YYYY-MM"), "YYYY-MM");

    if (config.error && ['ConnectorErrorWrongCredentials', 'ConnectorErrorCredentialsNotFound'].indexOf(config.error.errorName) > -1) {
      winston.error('we know we have a wrong login / password for this connector:', {name: config.name});
      runThem.bind(this)(mUserMe, list, date, updaterCallback, callback);

      return ;
    }
    if (config.mostRecentRun) {
      const mostRecentRunForConnector = moment(config.mostRecentRun, "YYYY-MM");
      if (mostRecentRunForConnector.format('X') > date.format('X')) {
        winston.info('we already process that date %s for the connector: %s', date.format("YYYY-MM"), config.name);
        runThem.bind(this)(mUserMe, list, date, updaterCallback, callback);
        return ;
      }
    }
    updaterCallback(date, config);
    runIt.bind(this)(mUserMe, config, date, (err) => {
      if (err) {
        self.emit('error', err)
      } else {
        self.emit('succeed', config);
      }
      runThem.bind(this)(mUserMe, list, date, updaterCallback, callback);
    });
  }

  var createBrowserWindowAsync = bluebird.promisify(createBrowserWindow);
  // util.inherits(runThem, EventEmitter);

  function runner() {
    EventEmitter.call(this);
    this.runThem = runThem.bind(this);
    this.iam = 'connectorRuner.runner';


  }
  util.inherits(runner, EventEmitter);

  module.exports = runner;
