'use strict';

const electron = require('electron');

const mainRunner = require('./mainRunner.js');

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


  // and load the index.html of the app.
  // mainWindow.loadURL('file://' + __dirname + '/index.html');
  mainWindow.loadURL('https://github.com/');

  // Open the DevTools.
  //mainWindow.webContents.openDevTools();

  

  // Emitted when the window is closed.
  mainWindow.on('closed', function() {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.

    mainWindow = null;
  });

  var firstLoad = true;

  mainWindow.webContents.on('did-finish-load', function() {


    var bw = mainWindow;
    console.log('started the runloop!');
    mainWindow.webContents.executeJavaScript("__hellobill.runLoop()");
    mainWindow.webContents.session.setDownloadPath(__dirname+'/downloads/');

    var dd = false;

    mainWindow.webContents.session.on('will-download', function(event, item, webContents) {
      event.preventDefault();
      if (dd == true) {
        return ;
      }
      dd = true;
      
      var url = require('url')
      var request = require('request');

      var fileURL = url.parse(item.getURL());
      var headers = {
        "Cookie": null
      }


      mainWindow.webContents.session.cookies.get({}, function(err, cookies) {
        // console.log('cookies:', cookies, fileURL)
        var ca = cookies.map(function(v) {

          return v.name+"="+v.value;
        });
        
        if (ca) {
          headers["Cookie"] = ca.join(';');
        } else {
          console.log('ca is null:', ca);
        }

        console.log('headers: ', headers)
        // request({
        //   uri: fileURL.href,
        //   headers:  headers
        // }, function(error, response, body) {
        //   console.log(response.headers)
        //     require('fs').writeFileSync(__dirname+"/billarico.pdf", body);
          
        // })
        var fs = require('fs');
        var requestOptions = {
          uri: fileURL.href,
          headers: headers
        }
        var filename = __dirname+"/billarico.pdf";
        request(requestOptions).pipe(fs.createWriteStream(filename)).on('close', () => {
          console.log('DONE!')
        });
        
      });



    });

    if (firstLoad == true) {
      const oneRunner = new mainRunner(mainWindow);

      oneRunner
      // .click(".header-actions .btn[href='/login']")
      // .waitForPage()
      // .typeText('#login_field', 'lasry.aric@gmail.com')
      // .typeText('#password', 'Jo31pal00!!!')
      // .waitMain()
      // .click('.auth-form-body input.btn-primary')
      // .waitForPage()
      .goto('https://github.com/settings/billing')
      .click('td.receipt a')
      .run();
      firstLoad = false;    
    }

    
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
