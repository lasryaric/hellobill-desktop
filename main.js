'use strict';

const electron = require('electron');
const ipcMain = require('electron').ipcMain;
const connectorsRunner = require('./lib/ConnectorsRunner');
const moment = require('moment');
const _ = require('lodash');



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

  ipcMain.on('fetchMyBills', function(a, data)  {
    appWindow.webContents.send('ConnectorsStatus', 'running');
    const date = moment("2015-12", "YYYY-MM");
    const dateStarted = moment();
    const trackEventName = "fetch_bills";
    const trackEventProps = {
      fetch_range: date.format('YYYY-MM')
    };
    const trackEventConnectorsStatus = {

    };
    console.log('running connector')
    var csr = new connectorsRunner();
    csr
    .on('succeed', (modelConnector) => {
      appWindow.webContents.send('ConnectorSucceed', modelConnector);
      trackEventConnectorsStatus['connector_'+modelConnector.name] = 'ok';
    })
    .on('error', (err) => {
      console.log('got an error emitted from connectorsRunner')
      const errorData = {
        errorMessage: err.message,
        errorName: err.name,
        modelConnector: err.modelConnector
      }
      trackEventConnectorsStatus['connector_'+err.modelConnector.name] = err.name;
      appWindow.webContents.send('ConnectorError', errorData);
    });

    csr.runThem(mUserMe, data, date, (err) => {
      if (err) {
        console.log('Done running all connectors but some of them failed.', err);
        return ;
      }
      const dateEnded = moment();
      const elapsedSeconds = parseInt(dateEnded.format("s"), 10) - parseInt(dateStarted.format('s'), 10);
      trackEventProps.elapsedSeconds = elapsedSeconds;
      _.merge(trackEventProps, trackEventConnectorsStatus);
      console.log('done running all connectors!');
      appWindow.webContents.send('ConnectorsStatus', 'idle');
      IntercomTrackIpc(trackEventName, trackEventProps);
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
      IntercomTrackIpc('selected_bills_folder', {folder: selectedFolder[0]})
    } else {
      IntercomTrackIpc('cancel_selection_folder')
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

function IntercomTrackIpc(name, props) {
  console.log('IntercomTrackIpc: ', arguments);

  appWindow.webContents.send('IntercomTrack', {
    eventName: name,
    eventProps: props
  });
}
