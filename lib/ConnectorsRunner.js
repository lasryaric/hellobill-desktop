'use strict';

const electron = require('electron');
const BrowserWindow = electron.BrowserWindow;
const ipcMain = require('electron').ipcMain;
const GithubConnector = require('./connectors/github');
const SkypeConnector = require('./connectors/skype');
const AdobeConnector = require('./connectors/adobe');
const mainRunner = require('../BrowserAutomation');
const EventEmitter = require('events');
const util = require('util');

const bluebird = require('bluebird');
const _ = require('lodash');

function createBrowserWindow(mConnector, callback) {
  var preload = __dirname + "/../preload.js";
  console.log('running preload script:', preload)
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
    console.log('closing theWindow!');
  });

  theWindow.webContents.on('did-finish-load', function() {



    console.log('starting __hellobill.runLoop()');
    theWindow.webContents.executeJavaScript("__hellobill.runLoop()");
    theWindow.webContents.session.setDownloadPath(__dirname+'/../downloads/');
    theWindow.canReceiveOrder = true;

  });



  theWindow.webContents.on('will-navigate', function(a, url) {
    console.log('will navigate', url);
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
      console.log('calling error method 1', config.name, err)
      onDoneOnce(err)
    })

    oneRunner.emitter.on('fileDownloaded', (data) => {
        self.emit('fileDownloaded', data);
    })



    connector
    .runAsync(date, config.credentials, oneRunner)
    .then(() => {
      console.log('calling error method 2', config.name)
      // oneRunner.setIsClosing();
      // callback();
      // bw.close();
      // bw = null;
      onDoneOnce()
    })
    .catch(function(err) {
      console.log('calling error method 3', config.name, err)
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

  if (list.length === 0) {
    console.log('runThem: all done!');
    callback();

    return ;
  }
  const self = this;

  const config = list.shift();
  if (!this.emit) {
    console.log('I have a wrong emit');
    console.trace();
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
  console.log('runner this is : ', this)

}
util.inherits(runner, EventEmitter);

module.exports = runner;
