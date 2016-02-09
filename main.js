'use strict';

const electron = require('electron');
require("babel-register");
// const uuid = require('node-uuid');
// const lodash = require('lodash');
const ipcMain = require('electron').ipcMain;
const moment = require('moment');




// Module to control application life.
const app = electron.app;
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow;

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

let appWindow;


function createWindow () {
  // Create the browser window.
  var preload = __dirname + "/preload.js";
  mainWindow = new BrowserWindow({width: 1200, height: 600, preload: preload, nodeIntegration: false, show:false});

  appWindow = new BrowserWindow({width: 1200, height: 600, preload: preload, nodeIntegration: true, show:true,
    "web-preferences": {
       "web-security": false
     }});

  mainWindow.loadURL('file://' + __dirname + '/index.html');
  appWindow.loadURL('http://localhost:3004/desktophome');



  mainWindow.webContents.openDevTools();
  appWindow.webContents.openDevTools();



  // Emitted when the window is closed.
  mainWindow.on('closed', function() {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.

    mainWindow = null;
  });


  mainWindow.webContents.on('did-finish-load', function() {



    console.log('starting __hellobill.runLoop()');
    mainWindow.webContents.executeJavaScript("__hellobill.runLoop()");
    mainWindow.webContents.session.setDownloadPath(__dirname+'/downloads/');
    mainWindow.canReceiveOrder = true;

  });

  mainWindow.webContents.on('dom-ready', function() {
    console.log('dom is now ready!')
  })

  mainWindow.webContents.on('will-navigate', function(a, url) {
    console.log('will navigate', url);
    mainWindow.canReceiveOrder = false;
  })

  ipcMain.on('remoteLog', function(sender, message) {

    console.log('< ' + message.message)
  })

  ipcMain.on('authenticationOk', () => {
    console.log(' ************* got login ok message!');
  })

  mainWindow.webContents.once('did-finish-load', function() {
    //here is the github runner originally
    const GithubConnector = require('./lib/connectors/github');
    // const GoogleConnector = require('./lib/connectors/google');
    const SkypeConnector = require('./lib/connectors/skype');
    const AdobeConnector = require('./lib/connectors/adobe');
    const date = moment("2016-01", "YYYY-MM");

    const adobe = new AdobeConnector(mainWindow);
    const skype = new SkypeConnector(mainWindow);
    const github = new GithubConnector(mainWindow);

    function runThem(list, date, callback) {
      if (list.length === 0) {
        if (callback) {
          callback();
        }

        return ;
      }
      const q = list.shift();
      q.runAsync(date)
      .then(() => {
        runThem(list, date);
      });
    }

    var list = [skype, adobe, github];

    //
    // runThem(list, date, () => {
    //   app.quit();
    //
    // });

  });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow();
  }
});
