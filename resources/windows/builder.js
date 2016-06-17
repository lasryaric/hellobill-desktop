var electronInstaller = require('electron-winstaller');


resultPromise = electronInstaller.createWindowsInstaller({
        appDirectory: '../hellobill-win32-x64',
        outputDirectory: '../output',
        exe: 'hellobill.exe',
        setupExe:'HellobillSetup.exe',
        authors:'Hellobill Inc',
        'signWithParams':' /a  ',
        noMsi:true,
        'iconUrl':'https://s3.amazonaws.com/www.hellobill.io/desktop-assets/hellobill.ico.ico',
        'loadingGif':'./resources/windows/hellobillinstaller.gif'
  });

resultPromise.then(() => console.log("It worked!"), (e) => console.log(`No dice: ${e.message}`));
