'use strict';

const electron = require('electron');
const bluebird = require('bluebird');
const uuid = require('node-uuid');
const lodash = require('lodash');




// Module to control application life.
const app = electron.app;
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow;

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;


function createWindow () {
  // Create the browser window.
  var preload = __dirname + "/preload.js";
  mainWindow = new BrowserWindow({width: 800, height: 600, preload: preload, nodeIntegration: false});

  mainWindow.loadURL('https://github.com/');


  mainWindow.webContents.openDevTools();



  // Emitted when the window is closed.
  mainWindow.on('closed', function() {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.

    mainWindow = null;
  });


  mainWindow.webContents.on('did-finish-load', function() {


    var bw = mainWindow;
    console.log('starting __hellobill.runLoop()');
    mainWindow.webContents.executeJavaScript("__hellobill.runLoop()");
    mainWindow.webContents.session.setDownloadPath(__dirname+'/downloads/');

  });

  //here is the github runner originally
  const GithubConnector = require('./lib/connectors/github');

  const oneGithub = new GithubConnector(mainWindow);
  oneGithub
  .runAsync("2015-01")
  .then(() => {
    console.log(1);
  })
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
