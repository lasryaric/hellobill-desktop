'use strict';

const ipcMain = require('electron').ipcMain;
const immutable = require('immutable');
const bluebird = require('bluebird');
const mkdirpAsync = bluebird.promisify(require('mkdirp'));


const messageName = 'invokeAction';

function mainRunner(bw, serviceName) {

	var filenameNB = 0;
	var willDownloadMemory = immutable.Set();
	var downloadedMemory = immutable.Set();

	this.typeText = function(cssSelector, text, callback) {
		const message = {
			action: 'typeText',
			cssSelector: cssSelector,
			text: text
		};

		sendToBrowser(message);
		onNextActionCompleted(callback);
	}

	this.click = function(cssSelector, callback) {
		const message = {
			action: 'click',
			cssSelector: cssSelector,
		};

		sendToBrowser(message);
		onNextActionCompleted(callback);
	}

	this.clickAndWaitForPage = function(cssSelector, callback) {
		const message = {
			action: 'click',
			cssSelector: cssSelector,
		};

		sendToBrowser(message);
		onNextPageLoad(callback);
	}

	this.getInnerHTML = function(cssSelector, callback) {
		const message = {
			action: 'getInnerHTML',
			cssSelector: cssSelector
		}

		sendToBrowser(message);
		onNextActionCompleted(callback);
	}

	this.getAttribute = function(cssSelector, attribute, callback) {
		const message = {
			action: 'getAttribute',
			cssSelector: cssSelector,
			attribute: attribute
		}

		sendToBrowser(message);
		onNextActionCompleted(callback);
	}

	this.elementExists = function(cssSelector, callback) {
		const message = {
			action: 'elementExists',
			cssSelector: cssSelector
		};

		sendToBrowser(message);
		onNextActionCompleted(callback);
	}

	this.waitForPage = function(callback) {
		onNextPageLoad(callback);
	}

	this.waitOnCurrentThread = function(millisec, callback) {
		setTimeout(callback, millisec);
	}

	this.goto = function(url, callback) {
		const message = {
			action: 'goto',
			url: url
		};

		sendToBrowser(message);
		onNextPageLoad(callback);
	}


	this.waitForCss = function(cssSelector, callback) {
		const message = {
			action: 'waitForCss',
			cssSelector: cssSelector
		}

		sendToBrowser(message);
		onNextActionCompleted(callback);
	}

	this.waitForDownload = function(service, date, callback) {
		const message = {
			action: 'waitForDownload',
			service: service,
			date: date.format("YYYY-MM"),
		};

		sendToBrowser(message);
		onNextDownload(date, callback);


	}

	function sendToBrowser(data) {
		console.log('sending message to browser: ', messageName, data)
		if (bw.canReceiveOrder === true) {
				bw.send(messageName, data);
		} else {
			console.log('can not receive order right now, postponing!');
			setTimeout(function() {
				sendToBrowser(data);
			}, 500);
		}

	}

	function onNextActionCompleted(callback) {
		ipcMain.once('doneExecuting', function(event, args) {
			console.log('got done doneExecuting message', args);
			setTimeout(function() {
				callback(null, args)
			}, 0);

		});
	}

	function onNextPageLoad(callback) {

		function couldNotExecuteHandler() {
			console.log('got could not execute!')
			bw.webContents.removeListener('did-finish-load', didLoadFinishHandler);
			setTimeout(callback, 0);
		}

		function didLoadFinishHandler() {
			//ipcMain.removeListener('couldNotExecute', couldNotExecuteHandler);
			setTimeout(callback, 0);
		}

		bw.webContents.once('did-finish-load', didLoadFinishHandler);

		//ipcMain.once('couldNotExecute', couldNotExecuteHandler);
	}

	function onNextDownload(dateInstance, callback) {

		function willDownloadHandler(event, item, webContents) {
			const remoteFileName = item.getFilename();

			willDownloadMemory  = willDownloadMemory.add(remoteFileName);
			event.preventDefault();
			console.log('will download!');


			var url = require('url')
			var request = require('request');

			var fileURL = url.parse(item.getURL());
			var headers = {
				"Cookie": null
			}

			bw.webContents.session.cookies.get({}, function(err, cookies) {
				const cookiesForDomain = cookies.filter((cookie) => {
					if (fileURL.host.indexOf(cookie.domain) > -1) {
						return true;
					}

					return false;
				});
				var ca = cookiesForDomain.map(function(v) {

					return v.name+"="+v.value;
				});

				if (ca) {
					headers.Cookie = ca.join(';');
				}

				console.log('headers are: ', headers.Cookie.length)

				var fs = require('fs');
				var requestOptions = {
					uri: fileURL.href,
					headers: headers
				}

				const dateStr = dateInstance.format("YYYY-MM");
				const filePath = __dirname+"/downloads/"+dateStr+"/"+serviceName+"/";
				mkdirpAsync(filePath)
				.then(() => {
					const fileFullPath = filePath + remoteFileName;

					console.log('lets go download :', fileURL.href)
					request(requestOptions).pipe(fs.createWriteStream(fileFullPath)).on('close', function() {
						console.log('DONE downloading!', fileFullPath);
						bw.canReceiveOrder = true;
						downloadedMemory = downloadedMemory.add(remoteFileName);
						bw.send('downloadNext');
						// callback(null, fileFullPath);
					});
				})

			});


		}

		function doneDownloadingHandler()  {
			bw.webContents.session.removeListener('will-download', willDownloadHandler);
			callback();
			console.log('done downloading for service: ', serviceName);
		}

		bw.webContents.session.on('will-download', willDownloadHandler);
		ipcMain.on('doneDownloading', doneDownloadingHandler);

		bw.on('close', function() {
			bw.webContents.session.removeListener('will-download', willDownloadHandler);
			ipcMain.removeListener('doneDownloading', doneDownloadingHandler);
		})
	}
}

module.exports = mainRunner;
