'use strict';

const ipcMain = require('electron').ipcMain;
const immutable = require('immutable');
const bluebird = require('bluebird');
const mkdirpAsync = bluebird.promisify(require('mkdirp'));
const EventEmitter = require('events');

const messageName = 'invokeAction';

class MyEmitter extends EventEmitter {}

function mainRunner(bw, serviceName, destinationFolder) {

	this.emitter = new MyEmitter();
	var self = this;
	var _errorTimeout = null;

	console.log('mainRunner: destinationFolder:', destinationFolder)
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
				scheduleErrorTimeout();
		} else {
			console.log('can not receive order right now, postponing!');
			setTimeout(function() {
				sendToBrowser(data);
			}, 500);
		}

	}

	function onNextActionCompleted(callback) {
		ipcMain.once('doneExecuting', function(event, args) {
			clearErrorTimeout();
			console.log('got done doneExecuting message', args);
			setTimeout(function() {
				callback(null, args)
			}, 0);

		});
	}

	function onNextPageLoad(callback) {

		function didLoadFinishHandler() {
			clearErrorTimeout();
			setTimeout(callback, 0);
		}

		bw.webContents.once('did-finish-load', didLoadFinishHandler);


	}

	function onNextDownload(dateInstance, callback) {

		function willDownloadHandler(event, item, webContents) {
			clearErrorTimeout();
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
				const filePath = destinationFolder +"/hellobill/"+dateStr+"/"+serviceName+"/";
				mkdirpAsync(filePath)
				.then(() => {
					const fileFullPath = filePath + remoteFileName;

					console.log('lets go download :', fileURL.href)
					request(requestOptions).pipe(fs.createWriteStream(fileFullPath)).on('close', function() {
						console.log('DONE downloading!', fileFullPath);
						bw.canReceiveOrder = true;
						downloadedMemory = downloadedMemory.add(remoteFileName);
						bw.send('downloadNext');
						scheduleErrorTimeout();
						// callback(null, fileFullPath);
					});
				})

			});


		}

		function doneDownloadingHandler()  {
			clearErrorTimeout();
			bw.webContents.session.removeListener('will-download', willDownloadHandler);
			callback();
			console.log('done downloading for service: ', serviceName);
		}



		bw.webContents.session.on('will-download', willDownloadHandler);
		ipcMain.on('doneDownloading', doneDownloadingHandler);


		bw.on('close', function() {
			bw.webContents.session.removeListener('will-download', willDownloadHandler);
			ipcMain.removeListener('doneDownloading', doneDownloadingHandler);
			ipcMain.removeListener('couldNotExecute', couldNotExecuteHandler);
		})
	}

	function scheduleErrorTimeout() {
		_errorTimeout = setTimeout(() => {
			self.emitter.emit('error', "did not hear back from the browser after 10 seconds");
		}, 10000);
	}

	function clearErrorTimeout() {
		if (_errorTimeout) {
			clearTimeout(_errorTimeout);
			_errorTimeout = null;
		}
	}

	function couldNotExecuteHandler(ax, errorData) {
		clearErrorTimeout();
		console.log('got a couldNotExecute from browser with errorData: ', errorData)
		self.emitter.emit('error', errorData)
	}

	ipcMain.on('couldNotExecute', couldNotExecuteHandler);
	bw.on('close', function() {
		ipcMain.removeListener('couldNotExecute', couldNotExecuteHandler);
	})


	bluebird.promisifyAll(this);
}

module.exports = mainRunner;
