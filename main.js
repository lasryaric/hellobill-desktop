'use strict';

const electron = require('electron');
const ipcMain = require('electron').ipcMain;
const connectorsRunner = require('./lib/ConnectorsRunner');
const moment = require('moment');



// Module to control application life.
const app = electron.app;
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow;

var mUserMe = null;


let appWindow;


function createWindow () {
  // Create the browser window.

  appWindow = new BrowserWindow({width: 1200, height: 600, nodeIntegration: true, show:true,
    "web-preferences": {
       "web-security": false
     }});


  appWindow.loadURL('http://localhost:3000/desktop/app/authenticate');

  //appWindow.webContents.openDevTools();


  ipcMain.on('remoteLog', function(sender, message) {

    console.log('< ' + message.message)
  })

  ipcMain.on('authenticationOk', () => {
    console.log(' ************* got login ok message!');
  })

  ipcMain.on('fetchMyBills', function(a, data)  {
    appWindow.webContents.send('ConnectorsStatus', 'running');
    const date = moment("2016-01", "YYYY-MM");

    console.log('running connector runner with: ', mUserMe, data, date)
    connectorsRunner(mUserMe, data, date, () => {
      console.log('done running all connectors!');
      appWindow.webContents.send('ConnectorsStatus', 'idle');
    })
  })

  ipcMain.on('selectDestinationFolder', function() {
    function saveDestinationFolder(destinationFolder) {
      appWindow.webContents.send('saveDestinationFolder', destinationFolder);
    }
    const selectedFolder = electron.dialog.showOpenDialog(appWindow, { properties: [ 'openDirectory']});
    if (selectedFolder !== undefined) {
      saveDestinationFolder(selectedFolder);
      console.log('selected folder is: ', selectedFolder);
    } else {
      console.log('select folder cancel')
    }

  })

  ipcMain.on('userMe', function(ax, mUser) {
    console.log('updating userMe: ', mUser);

    mUserMe = mUser;
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
  if (appWindow === null) {
    createWindow();
  }
});
