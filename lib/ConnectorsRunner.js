'use strict';

const electron = require('electron');
const BrowserWindow = electron.BrowserWindow;
const ipcMain = require('electron').ipcMain;
const GithubConnector = require('./connectors/github');
const SkypeConnector = require('./connectors/skype');
const AdobeConnector = require('./connectors/adobe');

var theWindow = null;


function createBrowserWindow(callback) {
  var preload = __dirname + "/../preload.js";
  console.log('running preload script:', preload)
  theWindow = new BrowserWindow({width: 1024, height: 860, preload: preload, nodeIntegration: true, show:true});
  console.log('the window is: ', theWindow)
  theWindow.loadURL('http://hellobill.io');
  //theWindow.webContents.openDevTools();

  theWindow.on('closed', function() {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    console.log('closing theWindow!');

    theWindow = null;
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

function runThem(list, date, callback) {
  if (list.length === 0) {
    console.log('runThem : done running all!');

      console.log('runThem: now running the callback!');
      callback();

    return ;
  }
  const config = list.shift();
  const q = getConnectorInstance(config.name);
  console.log('runThem: running config:', config)

  q.runAsync(date)
  .then(() => {
    runThem(list, date, callback);
  });
}

function getConnectorInstance(name) {
  var instance = null;

  switch (name) {
    case 'github':
    instance = new GithubConnector(theWindow);
    break;

    case 'skype':
    instance = new SkypeConnector(theWindow);
    break;

    case 'adobe':
    instance = new AdobeConnector(theWindow);
    break;

    default:
    throw Error("No connector found with the name : "+ name);
  }

  return instance;
}

function go(list, date, callback) {
  createBrowserWindow(function() {
    runThem(list, date, () => {
      callback();
      theWindow.close();
    });

  })
}

module.exports = go;
