'use strict';

const ConnectorsRunner = require('./ConnectorsRunner');

function testCredentials(mUserMe, mConnector) {
  const cr = new ConnectorsRunner();

  return cr.runIt(mUserMe, mConnector, null)
  .then(() => {
    return new Promise((yes, no) => {
      yes();
    })
  })
  .finally(() => {
    return cr.closeBrowserWindow(mConnector);
  })
}

module.exports = testCredentials;
