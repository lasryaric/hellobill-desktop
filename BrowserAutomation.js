'use strict';

const ipcMain = require('electron').ipcMain;
const immutable = require('immutable');
const bluebird = require('bluebird');
const mkdirpAsync = bluebird.promisify(require('mkdirp'));
const EventEmitter = require('events');
const errors = require('./errors/errors')
const config = require('./config/config.json');
const checksum = require('checksum');
const winston = require('winston');

bluebird.promisifyAll(checksum);

const messageName = 'invokeAction';

class MyEmitter extends EventEmitter {}

var timeoutCounter = 0;
var _errorTimeout = null;

function mainRunner(bw, serviceName, destinationFolder, modelConnector) {

	this.emitter = new MyEmitter();
	var self = this;

	var isClosing = false;

	console.log('mainRunner: destinationFolder:', destinationFolder)
	var filenameNB = 0;
	var willDownloadMemory = immutable.Set();
	var downloadedMemory = immutable.Set();

	function safeBrowserWindowSync(callback) {
		if (isClosing === true) {
			winston.verbose("We are closing, sorry.")

			return ;
		}

		callback(bw);
	}

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
		noOpToBrowser();
		winston.info("Waiting for page...");
		onNextPageLoad(() => {
			winston.info('Done waiting for page...');
			callback();
		});
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

	this.gotoInApp = function(url, callback) {
		const message = {
			action: 'goto',
			url: url
		};

		sendToBrowser(message);
		onNextActionCompleted(callback);
	}


	this.waitForCss = function(cssSelector, silent, callback) {
		if (!callback) {
			callback = silent;
			silent = false;
		}
		const message = {
			action: 'waitForCss',
			cssSelector: cssSelector,
			silent: silent,
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

	this.setIsClosing = function() {
		isClosing = true;
	}

	function noOpToBrowser() {
		scheduleErrorTimeout();
	}




	function sendToBrowser(data) {
		safeBrowserWindowSync((bw) => {
			if (bw.canReceiveOrder === true) {
				winston.info('sending message to browser', {messageName: messageName, data: data})
				bw.send(messageName, data);
				scheduleErrorTimeout();
			} else {
				winston.info('can not receive order right now, postponing!');
				setTimeout(function() {
					sendToBrowser(data);
				}, 500);
			}
		})

	}


	var onNextActionCompletedHandler = null;
	function onNextActionCompleted(callback) {
		onNextActionCompletedHandler = function (event, args) {
			clearErrorTimeout();
			winston.info('got done doneExecuting message', {args: args});

			callback(null, args)


		}
		ipcMain.once('doneExecuting', onNextActionCompletedHandler);
	}


	var didLoadFinishHandler = null;
	function onNextPageLoad(callback) {
		didLoadFinishHandler = function (ax) {
			winston.info('executing didLoadFinishHandler url: %s', ax.sender.getURL())
			clearErrorTimeout();
			setTimeout(callback, 0);
		}
		safeBrowserWindowSync((bw) => {
			bw.webContents.once('did-finish-load', didLoadFinishHandler);
		})

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
			safeBrowserWindowSync((bw) => {
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
						request(requestOptions)
						.on('error', function(err) {
							const customError = new errors.ConnectorErrorDownload(err.message);
							self.emitter.emit('error', customError)
						})
						.on('response', function(response) {
								console.log('download response code:', response.statusCode)
								if (response.statusCode < 200 || response.statusCode >= 400) {
										this.emit('error', new Error("Got status out of 200 for " + requestOptions.uri+" statusCode: "+response.statusCode));
								}

						})
						.pipe(fs.createWriteStream(fileFullPath))
						.on('close', function() {
							console.log('DONE downloading!', fileFullPath);
							bw.canReceiveOrder = true;
							downloadedMemory = downloadedMemory.add(remoteFileName);
							bw.send('downloadNext');

							checksum
							.fileAsync(fileFullPath)
							.then((fileHash) => {

								self.emitter.emit('fileDownloaded', {
									fileHash: fileHash,
									fileName: remoteFileName,
									connectorID: modelConnector._id
								})
							})

						})
						.on('error', function(err) {
							console.log('writting error:', err)
							const customError = new errors.ConnectorErrorDownload("Could not write the file at the following location: "+ err.path);
							self.emitter.emit('error', customError)
						})

					})

				});

			});

		}

		function doneDownloadingHandler()  {
			clearErrorTimeout();
			safeBrowserWindowSync((bw) => {
				bw.webContents.session.removeListener('will-download', willDownloadHandler);
			})
			callback();
			console.log('done downloading for service: ', serviceName);
		}


		safeBrowserWindowSync((bw) => {
			bw.webContents.session.on('will-download', willDownloadHandler);
		});
		ipcMain.on('doneDownloading', doneDownloadingHandler);


		bw.on('close', function() {
			isClosing = true;
			bw.webContents.session.removeListener('will-download', willDownloadHandler);
			ipcMain.removeListener('doneDownloading', doneDownloadingHandler);
			ipcMain.removeListener('couldNotExecute', couldNotExecuteHandler);
			bw.webContents.removeListener('did-finish-load', didLoadFinishHandler);
			ipcMain.removeListener('doneExecuting', onNextActionCompletedHandler);
		})
	}

	function scheduleErrorTimeout(timeoutMillisec) {
		timeoutMillisec = timeoutMillisec || config.clientSideTimeout;
		_errorTimeout = setTimeout(() => {
			const err = new errors.ConnectorErrorTimeOut("need to find last action :)" + new Date())
			self.emitter.emit('error', err);
		}, timeoutMillisec);
		_errorTimeout.customID = timeoutCounter++;
	}

	function clearErrorTimeout() {

		if (_errorTimeout !== null) {
			winston.info('Clearing timeout %s', _errorTimeout.customID)
			clearTimeout(_errorTimeout);
			_errorTimeout = null;
		} else {
				winston.error("We can't clear the timeout because we have no timeout scheduled :/")
			// throw new Error("We can't clear the timeout because we have no timeout scheduled :/")
		}
	}

	function couldNotExecuteHandler(ax, errorMessage) {
		clearErrorTimeout();
		winston.error('got a couldNotExecute from browser with errorDat ', {errorMessage: errorMessage});
		const err = new errors.ConnectorErrorCouldNotExecute(errorMessage);
		self.emitter.emit('error', err);
	}

	ipcMain.on('couldNotExecute', couldNotExecuteHandler);
	bw.on('close', function() {
		ipcMain.removeListener('couldNotExecute', couldNotExecuteHandler);
	})


	bluebird.promisifyAll(this);
}

module.exports = mainRunner;
