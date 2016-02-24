'use strict';

const electron = require('electron');
const shell = electron.shell;
const ipcMain = require('electron').ipcMain;
const connectorsRunner = require('./lib/ConnectorsRunner');
const moment = require('moment');
const _ = require('lodash');
const bluebird = require('bluebird');
const immutable = require('immutable');
const winston = require('winston');
const keytar = require('keytar');
const path = require('path');
const os = require('os');
const fs = require('fs');

require('winston-loggly');





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


  appWindow.loadURL('http://app.hellobill.io/desktop/app/authenticate');

  //appWindow.webContents.openDevTools();


  ipcMain.on('remoteLog', function(sender, message) {

    winston.info('< ' + message.message)
  })

  ipcMain.on('fetchMyBills', (ax, data) => {
    console.log('fetchMyBills: ', data)
    const immutableConnectors = immutable.fromJS(data);
    data.forEach((modelConnector) => {

    })
    fetchMyBillsRange(ax, immutableConnectors);
    }
  );

  function fetchMyBillsRange(a, connectors) {
    const dateFormat = "YYYY-MM";
    const startDate = moment("2015-01", dateFormat);
    const now = moment();
    var months = [];

    function newConnectorsHandler(ax, _connectors) {
      winston.info('got new connectors list');
      connectors = immutable.fromJS(_connectors);
    }
    ipcMain.on('connectorsUpdated', newConnectorsHandler);

    while (startDate.format(dateFormat) != now.format(dateFormat)) {
      months.push(startDate.format(dateFormat));
      startDate.add('1', 'months');

    }
    months.push(startDate.format(dateFormat));
    startDate.add('1', 'months');
    // months = ['2016-01']

    console.log('here are my months:', months);
    const fetchMyBillAsync = bluebird.promisify(fetchMyBill);
    bluebird.each(months, (month) => {
      console.log('working on :', month)
      const currentMonth = moment(month, dateFormat);

      return fetchMyBillAsync(currentMonth, connectors)

    })
    .catch((err) => {
      console.log('we got a fucking error here!', err)
    })
    .finally(() => {
      ipcMain.removeListener('connectorsUpdated', newConnectorsHandler);
    })

  }

   function fetchMyBill(date, connectors, fetchMyBillCallback)  {

    appWindow.webContents.send('ConnectorsStatus', 'running');
    // const date = moment("2015-12", "YYYY-MM");
    const dateStarted = moment();
    const trackEventName = "fetch_bills";
    const trackEventProps = {
      fetch_range: date.format('YYYY-MM')
    };
    const trackEventConnectorsStatus = {

    };
    winston.info('running connector')
    var csr = new connectorsRunner();
    csr
    .on('succeed', (modelConnector) => {
      appWindow.webContents.send('ConnectorSucceed', modelConnector);
      trackEventConnectorsStatus['connector_'+modelConnector.name] = 'ok';
      markConnectorSuccessDate(modelConnector._id, date.format('YYYY-MM'));
    })
    .on('fileDownloaded', (data) => {
      appWindow.webContents.send('fileDownloaded', data);
    })
    .on('error', (err) => {
      winston.info('got an error emitted from connectorsRunner')
      const errorData = {
        errorMessage: err.message,
        errorName: err.name,
        modelConnector: err.modelConnector
      }
      trackEventConnectorsStatus['connector_'+err.modelConnector.name] = err.name;
      appWindow.webContents.send('ConnectorError', errorData);
    });

    csr.runThem(mUserMe, connectors, date, (err) => {
      if (err) {
        winston.info('Done running all connectors but some of them failed.', err);
        fetchMyBillCallback();
        return ;
      }
      const dateEnded = moment();
      const elapsedSeconds = parseInt(dateEnded.format("X"), 10) - parseInt(dateStarted.format('X'), 10);
      trackEventProps.elapsedSeconds = elapsedSeconds;
      _.merge(trackEventProps, trackEventConnectorsStatus);
      winston.info('done running all connectors!');
      appWindow.webContents.send('ConnectorsStatus', 'idle');
      IntercomTrackIpc(trackEventName, trackEventProps);

      fetchMyBillCallback();
    })
  }


  ipcMain.on('selectDestinationFolder', function() {
    const selectedFolder = electron.dialog.showOpenDialog(appWindow, { properties: [ 'openDirectory']});
    if (selectedFolder !== undefined) {
      saveDestinationFolder(selectedFolder);
      winston.info('selected folder is: ', selectedFolder);
      IntercomTrackIpc('selected_bills_folder', {folder: selectedFolder[0]})
    } else {
      IntercomTrackIpc('cancel_selection_folder')
    }

  })

  ipcMain.on('userMe', function(ax, mUser) {
    winston.info('updating userMe: ', mUser);

    mUserMe = mUser;
    if (!mUserMe.destinationFolder) {
      const bestFolderFound = findBestTargetFolder();
      saveDestinationFolder(bestFolderFound);
      IntercomTrackIpc('best_folder_found', {folder: bestFolderFound})
    }
    initLoggerOnce(mUserMe.email);

  })

  ipcMain.on('ConnectorGotCredentials', (ax, data) => {
    console.log('got new credentials:', data);
    const serializedCredentials = JSON.stringify(data.credentials);
    console.log('did keytar?', keytar.replacePassword('hellobil_desktopapp', data.connectorID, serializedCredentials));

  })

  ipcMain.on('OpenTargetFolder', (ax, folders) => {
    var done = false;

    folders.forEach((folder) => {

      if (done === true) {
        return ;
      }
      if (fs.existsSync(folder)) {
        console.log('openning:', folder);
        done = true;
        shell.showItemInFolder(folder);
      }
    })
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
  winston.info('IntercomTrackIpc: ', arguments);

  appWindow.webContents.send('IntercomTrack', {
    eventName: name,
    eventProps: props
  });
}

function markConnectorSuccessDate(connectorID, dateStr) {
  winston.info('marking connector %s as success with date: %s', connectorID, dateStr)
  appWindow.webContents.send('markConnectorSuccessDate', {
    connectorID: connectorID,
    dateStr: dateStr
  });
}

var initLoggerOnce = _.once((email) =>  {
  const regexp = new RegExp('[a-z\_\.]', 'ig');
  const userTag = email.match(regexp).join('');

console.log('user tag is: ', userTag);
  winston.add(winston.transports.Loggly, {
     token: "b12892ce-f71b-4422-915f-2d7c4f841b0d",
     subdomain: "hellobill",
     tags: ['desktopApp', userTag],
     json:true,
  });
});


function saveDestinationFolder(destinationFolder) {
  appWindow.webContents.send('saveDestinationFolder', destinationFolder);
}

function findBestTargetFolder() {
  const bestCandidates = ['Dropbox', 'Desktop', 'Bureau', 'Documents'];
  const homeDirectory = os.homedir();
  var bestDirectory = null;

  bestCandidates.forEach((directory) => {
    if (bestDirectory !== null) {
      return ;
    }
    const bestCandidatePath = path.join(homeDirectory, directory);
    console.log('testing on :', bestCandidatePath)
    if (fs.existsSync(bestCandidatePath)) {
      bestDirectory = bestCandidatePath;
    }
  })
  if (bestDirectory === null) {
    bestDirectory = homeDirectory;
  }

  return bestDirectory;
}
