'use strict';

const knox = require('knox');
const bluebird = require('bluebird');
const winston = require('winston');
const os = require('os');
const moment = require('moment');
const zpad = require('zpad');

var fsClient = knox.createClient({
  key: process.env.AWS_KEY,
  secret: process.env.AWS_SECRET,
  bucket: "hellobilllogs",
});
bluebird.promisifyAll(fsClient);

//catpurePage does not respect the first callback arg error standard
function capturePageAsync(browserWindow) {
  return new Promise((yes) => {
    browserWindow.capturePage((nativeImage) => {
      return yes(nativeImage);
    })
  })
}

function CrawlerDebug(browserWindow, email, serviceName, session, messageUUID) {
  const paddedMessageUUID = zpad(messageUUID, 8);
  const folderPath = [email, moment().format("YYYY_MM_DD"), process.env.STARTUP_TIME, serviceName, paddedMessageUUID].join('/');
  const imageRemotePath = [folderPath, 'png'].join('.');
  const mhtmlRemotePath = [folderPath, 'mhtml'].join('.');
  const mhtmlLocalPath = os.tmpdir() + '/' + serviceName + '_'+moment().format('X')+'.mhtml';

  var promiseScreenShot = capturePageAsync(browserWindow);
  var promisePDF = browserWindow.webContents.savePageAsync(mhtmlLocalPath, 'MHTML');

  return Promise.all([promisePDF, promiseScreenShot])
  .then((values) => {
    const screenShot = values[1];
    const PNGImage = screenShot.toPng();
    const promiseUploadImage = fsClient.putBufferAsync(PNGImage, imageRemotePath, {'Content-Length': PNGImage.length})
    const promiseUploadPDF = fsClient.putFileAsync(mhtmlLocalPath, mhtmlRemotePath);
    Promise.all([promiseUploadPDF, promiseUploadImage])
    .then(() => {
      // winston.info('Done uploading image and PDF')
    })
    .catch((err) => {
            winston.error('Error uploading PDF and image:', err)
    })
  })
  .catch((err) => {
          winston.error('Error capturing image and PDF:', err);
  })

}

module.exports = {
  CrawlerDebug: CrawlerDebug
}
