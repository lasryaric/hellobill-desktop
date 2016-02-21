'use strict';

const electron = require('electron');
const BrowserWindow = electron.BrowserWindow;
const ipcMain = require('electron').ipcMain;
const GithubConnector = require('./connectors/github');
const SkypeConnector = require('./connectors/skype');
const AdobeConnector = require('./connectors/adobe');
const HellobilltestConnector = require('./connectors/hellobilltest');
const mainRunner = require('../BrowserAutomation');
const EventEmitter = require('events');
const util = require('util');
const winston = require('winston');
const moment = require('moment')
const keytar = require('keytar');

const bluebird = require('bluebird');
const _ = require('lodash');

function createBrowserWindow(mConnector, callback) {
  var preload = __dirname + "/../preload.js";
  winston.info('running preload script:', preload)
  var theWindow = new BrowserWindow({width: 1024, height: 860, preload: preload, nodeIntegration: false, show:true,
    "web-preferences": {
      partition:'persist:' + mConnector._id,
    }});

    theWindow.loadURL('http://hellobill.io');
    //theWindow.webContents.openDevTools();

    theWindow.on('closed', function() {
      // Dereference the window object, usually you would store windows
      // in an array if your app supports multi windows, this is the time
      // when you should delete the corresponding element.
      winston.info('closing theWindow!');
    });

    theWindow.webContents.on('did-finish-load', function() {



      winston.info('starting __hellobill.runLoop()');
      theWindow.webContents.executeJavaScript("__hellobill.runLoop()");
      theWindow.webContents.session.setDownloadPath(__dirname+'/../downloads/');
      theWindow.canReceiveOrder = true;

    });



    theWindow.webContents.on('will-navigate', function(a, url) {
      winston.info('will navigate', url);
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
          err.modelConnector = config;
        }
        winston.info('calling error method 1', config.name, err)
        onDoneOnce(err)
      })

      oneRunner.emitter.on('fileDownloaded', (data) => {
        self.emit('fileDownloaded', data);
      })


      const serializedCredentials = keytar.getPassword('hellobil_desktopapp', config._id);
      const credentials = JSON.parse(serializedCredentials);
      console.log('we found some credentials : ', credentials)
      connector
      .runAsync(date, credentials, oneRunner)
      .then(() => {
        winston.info('calling error method 2', config.name)
        // oneRunner.setIsClosing();
        // callback();
        // bw.close();
        // bw = null;
        onDoneOnce()
      })
      .catch(function(err) {
        winston.info('calling error method 3', config.name, err)
        if (err.modelConnector === 0) {
          err.modelConnector = config;
        }
        // callback(err);
        // oneRunner.setIsClosing();
        // bw.close();
        // bw = null;
        onDoneOnce(err);

      }.bind(this))
    })
  }

  function runThem(mUserMe, list, date, callback) {

    if (list.size === 0) {
      winston.info('runThem: all done!');
      callback();

      return ;
    }
    const self = this;


    const config = list.get(0).toJS();
    list = list.shift();
    if (!this.emit) {
      winston.info('I have a wrong emit');
      console.trace();
    }
    const monthBegin = moment(moment().format("YYYY-MM"), "YYYY-MM");

    if (config.error && config.error.errorName === 'ConnectorErrorWrongCredentials') {
      winston.info('we know we have a wrong login / password for this connector: %s', config.name);
      runThem.bind(this)(mUserMe, list, date, callback);

      return ;
    }
    if (config.mostRecentRun) {
      const mostRecentRunForConnector = moment(config.mostRecentRun, "YYYY-MM");
      if (mostRecentRunForConnector.format('X') > date.format('X')) {
        winston.info('we already process that date %s for the connector: %s', date.format("YYYY-MM"), config.name);
        runThem.bind(this)(mUserMe, list, date, callback);
        return ;
      }
    }
    runIt.bind(this)(mUserMe, config, date, (err) => {
      if (err) {
        self.emit('error', err)
      } else {
        self.emit('succeed', config);
      }
      runThem.bind(this)(mUserMe, list, date, callback);
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
