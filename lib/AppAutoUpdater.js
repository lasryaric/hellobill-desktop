const autoUpdater = require('auto-updater');
const nodeApp = require('app');
const os = require('os');
const winston = require('winston');

module.exports = (function(ui) {
  autoUpdater.on('checking-for-update', () => {
    winston.info('checking for update...')
    ui.send('checking-for-update')
  });
  autoUpdater.on('error', (err) => {
    winston.info('auto update error:', err)
    ui.send('error', err)
  });
  autoUpdater.on('update-available', (err) => {
    ui.send('update-available');
  });
  autoUpdater.on('update-not-available', (err) => {
    ui.send('update-not-available');
  });
  autoUpdater.on('update-downloaded', () => {
    winston.info('auto update update-downloaded');
    ui.send('update-downloaded')
    autoUpdater.quitAndInstall();
  });

  var platform = os.platform() + '_' + os.arch();
  var version = nodeApp.getVersion();
  const updateURL = process.env.RELEASE_SERVER_URL + '/update/'+platform+'/'+version;
  winston.info('checking update url: %s', updateURL)

  autoUpdater.setFeedURL(updateURL);
  autoUpdater.checkForUpdates()

});
