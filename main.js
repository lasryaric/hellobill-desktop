'use strict';

const electron = require('electron');
const shell = electron.shell;
const ipcMain = require('electron').ipcMain;
const ConnectorsRunner = require('./lib/ConnectorsRunner');
const ManualFixer = require('./lib/ManualFixer');
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
const AppConstants = require('./lib/constants/AppConstants');
const nodeApp = require('app');

var Menu = require("menu");
var S3StreamLogger = require('s3-streamlogger').S3StreamLogger;


// winston.add(winston.transports.File, { filename: '/Users/ariclasry/Desktop/hellobilllogs.log', json:false });


if (process.env.NODE_ENV) {
  dotenv.load({ path: __dirname+'/.env.'+process.env.NODE_ENV });
} else {
  dotenv.load({ path: __dirname+'/.env.production' });
}

const FSClient = require('./lib/utils/FSClient')
const Slack = require('./lib/utils/Slack');
const StrFormat = require('./lib/utils/StrFormat');
const appAutoUpdater = require('./lib/AppAutoUpdater')


winston.info('Loaded env:'+ process.env.LOADED_FILE);
if (process.env.LOADED_FILE !== 'production') {
  // require('trace'); // active long stack trace
  // require('clarify'); // Exclude node internal calls from the stack
  // Error.stackTraceLimit = Infinity;
}

// Module to control application life.
const app = electron.app;
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow;

var mUserMe = null;


let appWindow;


function createWindow () {
  // Create the browser window.

  var template = [{
      label: "Application",
      submenu: [
          { label: "About Application", selector: "orderFrontStandardAboutPanel:" },
          { type: "separator" },
          { label: "Quit", accelerator: "Command+Q", click: function() { app.quit(); }}
      ]}, {
      label: "Edit",
      submenu: [
          { label: "Undo", accelerator: "CmdOrCtrl+Z", selector: "undo:" },
          { label: "Redo", accelerator: "Shift+CmdOrCtrl+Z", selector: "redo:" },
          { type: "separator" },
          { label: "Cut", accelerator: "CmdOrCtrl+X", selector: "cut:" },
          { label: "Copy", accelerator: "CmdOrCtrl+C", selector: "copy:" },
          { label: "Paste", accelerator: "CmdOrCtrl+V", selector: "paste:" },
          { label: "Select All", accelerator: "CmdOrCtrl+A", selector: "selectAll:" }
      ]}
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));

  appWindow = new BrowserWindow({width: 1200, height: 600, nodeIntegration: true, show:true,
    "web-preferences": {
      "web-security": false
    }});


    appWindow.loadURL(process.env.WEBAPP_STARTING_POINT + '/desktop/'+AppConstants.webVersion+'/app/autoupdater');

    if (process.env.LOADED_FILE !== 'production') {
      appWindow.webContents.openDevTools();
    }


    ipcMain.on('remoteLog', function(sender, message) {

      winston.info('< ' + message.message)
    })

    var testingCredentials = false;
    ipcMain.on('TestCrendentials', (ax, modelConnectorJS) => {
        if (true === testingCredentials) {
          winston.error("Already testing credentials, can't test now");
          return ;
        }
        testingCredentials = true;
        const modelConnector = immutable.fromJS(modelConnectorJS);
        const cr = new ConnectorsRunner();

        cr.runIt(mUserMe, modelConnectorJS, null)
        .then(() => {
          console.log('credentials valid!')
          appWindow.send('TestCrendentialsResult', {success:true})
        })
        .catch((err) => {
          appWindow.send('TestCrendentialsResult', {success:false, errName: err.name})
        })
        .finally(() => {
          testingCredentials = false;
          return cr.closeBrowserWindow(modelConnectorJS);
        })
    })

    ipcMain.on('ManualFixer', (ax, mConnector) => {
      mConnector = immutable.fromJS(mConnector);
      const serializedCredentials = keytar.getPassword('hellobil_desktopapp', mConnector.get('_id'));
      const credentials = JSON.parse(serializedCredentials);
      console.log('*** found credentials:', credentials);
      var manualFixer = new ManualFixer(mConnector, credentials);
      manualFixer.start();

      ipcMain.once("CloseManualFixer", () => {
        manualFixer.end();
        appWindow.send('ManualFixerIsDone')

      })
    })

    var _fetchMyBillsLock = false;

    ipcMain.on('fetchMyBills', (ax, fetchParams) => {
      if (true === _fetchMyBillsLock) {
        winston.info('fetchMyBills is locked!');

        return ;
      }
      if (!fetchParams.list || !fetchParams.list.filter) {
        winston.error('datalist || datalist.filter are null', datalist);

        return ;
      }
      var data = fetchParams.list.filter((connector) => {
        return true; // (supportedConnectors.indexOf(connector.name) > -1);
      });
      winston.info("Lets go with the following date %s", fetchParams.startDate);

      _fetchMyBillsLock = true;
      winston.info("Got fetch my bills order!");
      const sessionStats = {};
      const connectorsList = data.map((connector) => { return connector.name }).join(', ');
      Slack.sendMessage('Got fetchMyBill order for user '+mUserMe.email+' with the following connectors: ' + connectorsList+', start date: '+fetchParams.startDate);
      if (false === fs.existsSync(mUserMe.destinationFolder)) {
        electron.dialog.showMessageBox(null, {
          title: "Read this",
          message: 'Please select a valid destination folder and click "fetch my bills!" again.',
          type: "info",
          buttons:['ok got it'],
        })

        _fetchMyBillsLock = false;

        return ;
      }
      var immutableConnectors = immutable.fromJS(data);

      const dateFormat = "YYYY-MM";
      const startDate = moment(fetchParams.startDate, dateFormat);
      const now = moment();
      var months = [];

      while (startDate.format(dateFormat) !== now.format(dateFormat)) {
        months.push(startDate.format(dateFormat));
        startDate.add('1', 'months');
      }
      months.push(startDate.format(dateFormat));
      startDate.add('1', 'months');
      months = months.reverse();
      // months = ['2016-01'];

      appWindow.webContents.send('ConnectorsStatus', {status:'running', description:'Starting...'});
      var doNotRetryList = immutable.Set();

      function fileDownloadedHandler(data) {
        console.log('file downloaded!', data)
        if (!sessionStats[data.name]) {
          sessionStats[data.name] = 1;
        }
        sessionStats[data.name]++;

        var remotepath = '/'+mUserMe.email+"/"+data.dumpDirectory+data.fileName;
        console.log('dump: %s, %s, %s', data.localFileName, remotepath)
        appWindow.webContents.send('fileDownloaded', data);

        FSClient.putFile(data.localFileName, remotepath, (err) => {
          if (err) {
              winston.error('Error dumping file: %s', err.message);

              return ;
          }
          winston.info('successfully uploaded to : %s %s', data.localFileName, remotepath)
        })



      }

      var total = immutableConnectors.size * months.length;
      var counter = 0;

      return bluebird
      .map(immutableConnectors, (modelConnector) => {

        const modelConnectorJS = modelConnector.toJS();
        const cr = new ConnectorsRunner();
        cr.on('fileDownloaded', fileDownloadedHandler);

          return bluebird
          .each(months, (monthStr) => {
          const thisMoment = moment(monthStr, "YYYY-MM");

          appWindow.webContents.send('ConnectorsStatus', {status:'running', description:'Working on '+modelConnector.get('name')+' / '+thisMoment.format("YYYY-MM")+', ('+parseInt((counter/total * 100), 10)+'%)'});
          counter++;

          if (doNotRetryList.has(modelConnector.get('_id'))) {
            winston.info('Skipping %s / %s because it is on the do not retry list', modelConnector.get('name'), monthStr);

            return ;
          }

          if (modelConnector.get('error')) {
            const errorName = modelConnector.getIn(['error', 'errorName']);
            if (['ConnectorErrorWrongCredentials', 'ConnectorErrorCredentialsNotFound'].indexOf(errorName) > -1) {
                winston.info('Skipping %s / %s because the connector is marked as errored with %s / ', modelConnector.get('name'), monthStr, errorName, modelConnector.getIn(['error', 'errorMessage']));

                return ;
            }
          }

          return cr
          .runIt(mUserMe, modelConnectorJS, thisMoment)
          .then(() => {
            winston.info('done for %s / %s', modelConnector.get('name'), monthStr);
            appWindow.webContents.send('ConnectorSucceed', modelConnector.toJS());
          })
          .catch((err) => {
            winston.error('Error for connector %s / %s. error:%s errorMessage: %s', modelConnector.get('name'), monthStr, err.name, err.message)
            const errorData = {
              errorMessage: err.message,
              errorName: err.name,
              modelConnector: err.modelConnector
            }
            appWindow.webContents.send('ConnectorError', errorData);

            if (['ConnectorErrorWrongCredentials', 'ConnectorErrorCredentialsNotFound'].indexOf(err.name) > -1) {
              doNotRetryList = doNotRetryList.add(modelConnector.get('_id'));
            }
            console.log('Adding %s to the doNotRetryList: ', doNotRetryList.has(modelConnector.get('_id')));

          })
        })
        .then(() => {
          cr.removeListener('fileDownloaded', fileDownloadedHandler);
          return cr.closeBrowserWindow(modelConnectorJS);

        })
      }, {concurrency: 1})
      .catch((err) => {
        winston.error('We got an error in main: ', {err:err.message, errName: err.name})
      })
      .then(() => {
        _fetchMyBillsLock = false;

        setTimeout(() => {
          Slack.sendMessage('Done fetching bills for '+mUserMe.email+', details: '+ StrFormat.hashMapToString(sessionStats))
        }, 1000)
        appWindow.webContents.send('ConnectorsStatus', {status:'idle'});
        appWindow.webContents.send('FetchItAgain', {});
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
      if (mUserMe === null && mUser && mUser.email) {
        Slack.sendMessage('The following user just opened the app: '+ mUser.email + ', version ' + nodeApp.getVersion() + ', platform: ' + os.platform());
      }
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

    ipcMain.on('FetchCredentials', (sender, data) => {
      if (!data || !data.forEach) {
        winston.info("No connector to get credentials for");
        return null;
      }

      const credentials = {};
      data.forEach((connectorID) => {
        const serializedCredentials = keytar.getPassword('hellobil_desktopapp', connectorID);
        if (!serializedCredentials) {
          winston.error("Did not find credentials for connector: %s", connectorID)
          return ;
        }
        const credentialsObj = JSON.parse(serializedCredentials);
        credentials[connectorID] = credentialsObj;
      })

      sender.sender.send('CredentialsAvailable', credentials)
    });


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

    ipcMain.on('CheckForAutoUpdater', () => {
      appAutoUpdater(appWindow.webContents);
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

    var s3_stream = new S3StreamLogger({
                 bucket: "hellobilllogs",
          access_key_id: process.env.AWS_KEY,
      secret_access_key: process.env.AWS_SECRET,
      name_format: email+'/%Y-%m-%d-%H-%M-%S-%L.log',
    });

    winston.add(winston.transports.File, {
      stream: s3_stream,
      json: false
    })
  });


  function saveDestinationFolder(destinationFolder) {
    appWindow.webContents.send('saveDestinationFolder', destinationFolder);
  }

  function findBestTargetFolder() {
    const bestCandidates = ['Dropbox', 'Google Drive', 'Desktop', 'Documents'];
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



  process.on('uncaughtException', (err) => {
    const errorProps = {
      errName: err.name,
      errMessage: err.message,
      errStack: err.stack
    }
    winston.error('uncaughtException:', {errorProps: errorProps})
  });

require('./lib/SquirelEventHandler.js')
