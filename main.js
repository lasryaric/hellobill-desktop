'use strict';

const electron = require('electron');
const shell = electron.shell;
const ipcMain = require('electron').ipcMain;
const ConnectorsRunner = require('./lib/ConnectorsRunner');
const moment = require('moment');
const _ = require('lodash');
const bluebird = require('bluebird');
const immutable = require('immutable');
const winston = require('winston');
const keytar = require('keytar');
const path = require('path');
const os = require('os');
const fs = require('fs');
const dotenv = require('dotenv');

require('winston-loggly');


winston.add(winston.transports.File, { filename: 'hellobilllogs.log', json:false });


if (process.env.NODE_ENV) {
  dotenv.load({ path: __dirname+'/.env.'+process.env.NODE_ENV });
} else {
  dotenv.load({ path: __dirname+'/.env.production' });
}

winston.info('Loaded env:'+ process.env.LOADED_FILE);

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


    appWindow.loadURL(process.env.WEBAPP_STARTING_POINT + '/desktop/app/authenticate');

    //appWindow.webContents.openDevTools();


    ipcMain.on('remoteLog', function(sender, message) {

      winston.info('< ' + message.message)
    })

    ipcMain.on('fetchMyBills', (ax, data) => {
      winston.info("Got fetch my bills order!");
      if (false === fs.existsSync(mUserMe.destinationFolder)) {
        electron.dialog.showMessageBox(null, {
          title: "Read this",
          message: 'Please select a valid destination folder and click "fetch my bills!" again.',
          type: "info",
          buttons:['ok got it'],
        })


        return ;
      }
      const immutableConnectors = immutable.fromJS(data);

      const dateFormat = "YYYY-MM";
      const startDate = moment().subtract(10, 'months');
      const now = moment();
      var months = [];

      while (startDate.format(dateFormat) !== now.format(dateFormat)) {
        months.push(startDate.format(dateFormat));
        startDate.add('1', 'months');
      }
      months.push(startDate.format(dateFormat));
      startDate.add('1', 'months');
      months = months.reverse();
      // months = ['2015-10']

      // fetchMyBillsRange(ax, immutableConnectors);
      return bluebird
      .each(immutableConnectors, (modelConnector) => {
        const cr = new ConnectorsRunner();

        const monthPromise = bluebird.each(months, (monthStr) => {
          const thisMoment = moment(monthStr, "YYYY-MM");

          return cr
          .runIt(mUserMe, modelConnector.toJS(), thisMoment)
          .then(() => {
            winston.info('done for %s / %s', modelConnector.get('name'), monthStr);
          })
        });
        monthPromise
        .then(() => {
            return cr.closeBrowserWindow();
        })

        return monthPromise;
      })

    });


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


  ipcMain.on('OpenTargetFolder', (ax, destinationFolder) => {
    var done = false;
    const folders =[];
    const hellobillPath = path.join(destinationFolder, 'hellobill');
    folders.push(hellobillPath);
    folders.push(destinationFolder)

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

  if (process.env.LOADED_FILE !== "production") {
    console.log("Not enabling the logger because we are not in production. We are in: ", process.env.NODE_ENV);

    return ;
  }


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
