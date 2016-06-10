'use strict';


const ipcMain = require('electron').ipcMain;
const immutable = require('immutable');
const bluebird = require('bluebird');
const mkdirpAsync = bluebird.promisify(require('mkdirp'));
const EventEmitter = require('events');
const errors = require('./errors/errors')
// const config = require('./config/config.json');
const checksum = require('checksum');
const winston = require('winston');
const fs = require('fs');
const request = require('requestretry');
const _ = require('lodash');
const tough = require('tough-cookie');
const knox = require('knox');
const moment = require('moment');
const os = require('os');


bluebird.promisifyAll(checksum);
const messageName = 'invokeAction';

class MyEmitter extends EventEmitter {}

//forwarding event from main IPC channel to webContents instances
['doneExecuting', 'doneDownloading'].forEach((eventName) => {
	ipcMain.on(eventName, function(event, a, b, c) {
			const webContents = event.sender;
			webContents.emit(eventName, event, a, b, c);
	});
})

var lastMessageUUID = null;
var lastMessageData = null;
var messageUUIDCounter = 1;


function mainRunner(bw, serviceName, destinationFolder, email, connectorUsername, modelConnector) {

	var fsClient = knox.createClient({
		key: process.env.AWS_KEY,
		secret: process.env.AWS_SECRET,
		bucket: "hellobilllogs",
	});
	bluebird.promisifyAll(fsClient);
	bluebird.promisifyAll(bw);
	bluebird.promisifyAll(bw.webContents);
	// var lastMessageUUID = null;
	// var lastMessageData = null;
	// var messageUUIDCounter = 1;

	//catpurePage does not respect the first callback arg error standard
	function capturePageAsync() {
		return new Promise((yes) => {
			bw.capturePage((nativeImage) => {
				return yes(nativeImage);
			})
		})
	}

	this.emitter = new MyEmitter();
	var self = this;

	var isClosing = false;

	console.log('mainRunner: destinationFolder:', destinationFolder)
	var willDownloadMemory = immutable.Set();
	var downloadedMemory = immutable.Set();


	function setlastMessageUUID(value) {
		if (value === null) {
			winston.verbose('clean lastMessageUUID, value about to be cleaned: ', lastMessageUUID)

		} else {
			winston.verbose('Setting lastMessageUUID, curent value, new value', lastMessageUUID, value)
		}
		// console.trace();
		lastMessageUUID = value;
	}



	function safeBrowserWindowSync(callback) {
		if (isClosing === true) {
			winston.error("We are closing, sorry.")

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

	this.clickReal = function(cssSelector, callback) {
		const message = {
			action: 'getMiddlePosition',
			cssSelector: cssSelector,
		};
		sendToBrowser(message);
		onNextActionCompletedAsync().then((position) => {
			const x = position.left + 10;
			const y = position.top + 10;

			bw.webContents.sendInputEvent({
				type:'mouseDown',
				x:x,
				y:y,
				button:'left',
				clickCount: 1
			})
			bw.webContents.sendInputEvent({
				type:'mouseUp',
				x:x,
				y:y,
				button:'left',
				clickCount: 1
			})
		})
		.then(callback)
	}

	this.clickAll = function(cssSelector, callback) {
		const message = {
			action: 'clickAll',
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

	this._goto = function(url, callback) {
		const message = {
			action: 'goto',
			url: url
		};

		onNextPageLoad(callback, url);
		sendToBrowser(message);
	}

	this.goto = function(url, callback) {
		var gotoTimeout = setTimeout(function() {
			var e = new Error("Calling the safe timeout of BrowserAutomation.goto() for url "+url+", something is wrong!");
			if (process.env.LOADED_FILE === 'production') {

				winston.error("Calling the safe timeout of BrowserAutomation.goto() for url %s, something is wrong! Stacktrace is: \n %s", url, e.stack);

				this._goto(url, callback);
			} else  {
				throw e;
			}
		}.bind(this), 45000);

		function safeCallback() {
			clearTimeout(gotoTimeout);
			callback();
		}
		this._goto(url, safeCallback);

	}

	this.waitForURL = function(urls, callback) {
		function urlMatch(current, urls) {
			var matches = urls.filter((one) => {
				if (current.indexOf(one) > -1) {
					return true;
				}

				return false;
			})
			console.log('did I find a match?', matches, current, urls)

			return (matches.length > 0);
		}


		function didLoadFinishHandler() {
			const currentURL = bw.getURL();
			if (urlMatch(currentURL, urls)) {
				bw.webContents.removeListener('runloop-ready', didLoadFinishHandler);
				setTimeout(function() {
					console.log('***** FOUND A MATCH! DONE!', currentURL)
					callback();
				}, 0)
			}
		}
		bw.webContents.on('runloop-ready', didLoadFinishHandler);
		didLoadFinishHandler();

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
		winston.info('calling super waitForCss with selector: ', cssSelector)

		if (!callback) {
			callback = silent;
			silent = false;
		}
		var reEnter = 0;
		setlastMessageUUID(null);

		function _waitForCss(cssSelector, silent) {

			const message = {
				action: 'waitForCss',
				cssSelector: cssSelector,
				silent: silent,
			}

			console.log('setting up the callback');

			if (reEnter > 0) {

				setlastMessageUUID(null);
			}
			reEnter++;
			setlastMessageUUID(null);
			sendToBrowser(message);
		}

		function safeCallback() {
			console.log('calling safe callback with arguments:', arguments);
			bw.webContents.removeListener('runloop-ready', wfcDidFinishLoadHandler);
			console.log('cleared the callback 2');
			return callback.apply(null, arguments);
		}

		function wfcDidFinishLoadHandler() {
			console.log('cleared the callback 1');
			winston.info("waitForCss re-injecting after page change while waiting.", {cssSelector:cssSelector, silent:silent})
			_waitForCss(cssSelector, silent);
		}

		bw.webContents.on('runloop-ready', wfcDidFinishLoadHandler);

		onNextActionCompleted(safeCallback);
		_waitForCss(cssSelector, silent)

	}

	this.waitForDownload = function(service, date, subAccount, callback) {
		if (!callback) {
			callback = subAccount;
			subAccount = null;
		}
		const message = {
			action: 'waitForDownload',
			service: service,
			date: date.format("YYYY-MM"),
		};

		sendToBrowser(message);
		onNextDownload(date, subAccount, callback);


	}

	this.clientSideFunction = function(service, date, functionName, callback) {
		const message = {
			action: 'clientSideFunction',
			service: service,
			date: date.format("YYYY-MM"),
			functionName: functionName,
		};

		sendToBrowser(message);

		onNextActionCompleted(callback);
	}

	this.setIsClosing = function() {
		isClosing = true;
	}

	this.savePageAsPDF = function(momentDate, subAccount, callback) {
		if (!callback) {
			callback = subAccount;
			subAccount = null;
		}
		bw.webContents.printToPDF({
			printBackground: true
		}, function(error, data) {

			if (error) {
				callback(error);
			}


			const fileDirectory = getBillDirectory(serviceName, momentDate.format("YYYY-MM"), connectorUsername, subAccount);
			const fileHash = checksum(data);
			const urlHash = checksum(bw.webContents.getURL());
			var fileName = serviceName+"_"+momentDate.format("YYYY-MM")+"_"+urlHash.substr(0, 6)+".pdf"; //getBillIncrementalFileName("uber_"+momentDate.format("YYYY-MM"), 'pdf', fileDirectory);
			const dumpDirectory = serviceName+"/"+momentDate.format("YYYY-MM")+"/";

			mkdirpAsync(fileDirectory)
			.then(() => {
				fs.writeFile(fileDirectory + fileName, data, function(error) {
					if (error) {
						callback(error)
					}
					console.log("*** SAVED AS PDF!!!", fileName);
					self.emitter.emit('fileDownloaded', {
						fileHash: fileHash,
						fileName: fileName,
						pdfURL: bw.webContents.getURL(),
						connectorID: modelConnector._id,
						localFileName: fileDirectory + fileName,
						dumpDirectory: dumpDirectory,
						name: serviceName,
					})

					callback();
				})
			})
		})
	}

	function noOpToBrowser() {

	}




	function sendToBrowser(data) {
		safeBrowserWindowSync((bw) => {
			// if (bw.canReceiveOrder === true) {
			if (lastMessageUUID !== null && process.env.LOADED_FILE !== 'production') {
				winston.error("Last message UUID is not null and we are trying to send another one", {lastMessageUUID: lastMessageUUID, newData: JSON.stringify(data), lastMessageData:JSON.stringify(lastMessageData)});
				throw new Error("Last message UUID is not null and we are trying to send another one");
			}
			if (data.messageUUID) {
				throw new Error("data.messageUUID is already defined!");
			}
			data.messageUUID = messageUUIDCounter++;
			setlastMessageUUID(data.messageUUID);
			lastMessageData = data;
			winston.info('sending message to browser', {messageName: messageName, data: data})
			bw.send(messageName, data);
			// } else {
			// 	winston.info('can not receive order right now, postponing!');
			//
			// 	setTimeout(function() {
			// 		sendToBrowser(data);
			// 	}, 3000);
			// }
		})

	}



	function onNextActionCompleted(callback) {
		function onNextActionCompletedHandler(event, args) {
			clearErrorTimeout();
			if (!args.originalMessageUUID) {
				console.log("no originalMessageUUID for this message!", args)
				throw new Error("no originalMessageUUID for this message!");
			}
			setlastMessageUUID(null);
			winston.info('got done doneExecuting message', args);
			if (args.errorMessage) {
				const correlatedFileName = moment().format();
				const imageRemotePath = email+'/screenshots/'+serviceName+'/'+correlatedFileName+'.png';
				const mhtmlRemotePath = email+'/mhtml/'+serviceName+'/'+correlatedFileName+'.mhtml';
				const mhtmlLocalPath = os.tmpdir() + '/' + serviceName + '_'+correlatedFileName+'.mhtml';

				capturePageAsync()
				.then((nativeImage) => {
					const PNGImage = nativeImage.toPng();

					return fsClient.putBufferAsync(PNGImage, imageRemotePath, {'Content-Length': PNGImage.length})
				})
				.then(() => {
					winston.info('successfully uploaded the screenshot %s', imageRemotePath)
				})
				.then(() => {
					return bw.webContents.savePageAsync(mhtmlLocalPath, 'MHTML')
					.then(() => {
						return fsClient
						.putFileAsync(mhtmlLocalPath, mhtmlRemotePath);
					})
				})
				.then(() => {
					winston.info('successfully uploaded the mhtml %s', mhtmlRemotePath)
				})
				.catch((err) => {
					winston.error("We got an error trying to dump the mhtml and screenshot: %s %s", err.name, err.message);
				})
				.then(() => {
						callback(new errors.ConnectorErrorCouldNotExecute(args.errorMessage));
				});
			} else {
				callback(null, args.result);
			}



		}

		bw.webContents.once('doneExecuting', onNextActionCompletedHandler);

		scheduleErrorTimeout(() => {
			wb.webContents.removeListener('doneExecuting', onNextActionCompletedHandler);
		})
	}

	const onNextActionCompletedAsync = bluebird.promisify(onNextActionCompleted);



	function onNextPageLoad(callback, url) {
		url = url || 'unknown';

		function didLoadFinishHandler(ax) {
			winston.info('executing didLoadFinishHandler url: %s', ax.sender.getURL())
			clearErrorTimeout();
			setlastMessageUUID(null);
			setTimeout(callback, 0);
		}

		// function didFailedLoadHandler(ax) {
		//
		// 	if ([500, 404, 400].indexOf(ax.statusCode) > -1) {
		// 		winston.error('http error: %s for url %s', ax.statusCode, ax.url)
		// 		electron.dialog.showMessageBox(null, {
		// 			title: "Read this",
		// 			message: 'We got an error for the following url: '+ ax.url,
		// 			type: "info",
		// 			buttons:['ok got it'],
		// 		})
		// 	}
		// }
		winston.info('Asked to listen on url %s', url)
		safeBrowserWindowSync((bw) => {
			// bw.webContents.session.webRequest.onCompleted(['*'], didFailedLoadHandler);

			bw.webContents.once('runloop-ready', didLoadFinishHandler);
			winston.info('now listening on url %s', url)
			scheduleErrorTimeout(() => {
				bw.webContents.removeListener('runloop-ready', didLoadFinishHandler);
			})
		})

	}

	function onNextDownload(dateInstance, subAccount, cb) {
		var downloadTimeout = null;

		var callback = function() {
			clearTimeout(downloadTimeout);
			cb.apply(this, arguments);

		}.bind(this);

		callback = _.once(callback);
		downloadTimeout = setTimeout(() => {
			console.log('****** DOWNLOAD FAILED, calling callback!');
			_onErrorCleanUp(new Error("Download timeout..."))
			callback();
		}, 45000);

		scheduleErrorTimeout(() => {
			_onErrorCleanUp(new Error("We never heard back from the downloader"));
		});
		function willDownloadHandler(event, item) {
			clearErrorTimeout();
			const remoteFileName = item.getFilename();

			willDownloadMemory  = willDownloadMemory.add(remoteFileName);
			event.preventDefault();
			console.log('will download!');


			var url = require('url')

			var fileURL = url.parse(item.getURL());
			var headers = {
				"Cookie": null,
				"user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/49.0.2623.112 Safari/537.36"
			}
			safeBrowserWindowSync((bw) => {
				bw.webContents.session.cookies.get({}, function(err, cookies) {
					const cookiesForDomain = cookies.filter((cookie) => {

						if (tough.domainMatch(fileURL.host, cookie.domain, true) && tough.pathMatch(fileURL.pathname, cookie.path)) {
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

					var requestOptions = {
						uri: fileURL.href,
						headers: headers,
						maxAttempts: 3,
						retryDelay: 2000
					};

					const dateStr = dateInstance.format("YYYY-MM");
					const filePath = getBillDirectory(serviceName, dateStr, connectorUsername, subAccount);

					mkdirpAsync(filePath)
					.then(() => {
						const fileFullPath = filePath + remoteFileName;

						winston.info('lets go download : %s', fileURL.href)
						request(requestOptions)
						.on('error', function(err) {
							_onErrorCleanUp(err);
							const customError = new errors.ConnectorErrorDownload(err.message);
							callback(customError);
						})
						.on('response', function(response) {
							winston.info('download response code: %s', response.statusCode)
							if (response.statusCode < 200 || response.statusCode >= 400) {

								callback(new Error("Got status out of 200 for " + requestOptions.uri+" statusCode: "+response.statusCode));
							}

						})
						.pipe(fs.createWriteStream(fileFullPath))
						.on('close', function() {
							winston.info('DONE downloading: %s', fileFullPath);
							bw.canReceiveOrder = true;
							downloadedMemory = downloadedMemory.add(remoteFileName);
							scheduleErrorTimeout();
							bw.send('downloadNext');
							winston.info("Sending downloadNext message");

							checksum
							.fileAsync(fileFullPath)
							.then((fileHash) => {
								const dumpDirectory = serviceName+"/"+dateInstance.format("YYYY-MM")+"/";
								self.emitter.emit('fileDownloaded', {
									fileHash: fileHash,
									fileName: remoteFileName,
									connectorID: modelConnector._id,
									localFileName: fileFullPath,
									dumpDirectory: dumpDirectory,
									name: serviceName,
								})
							})

						})
						.on('error', function(err) {
							_onErrorCleanUp(err);
							winston.error('Write error', {err: err})
							const customError = new errors.ConnectorErrorDownload("Could not write the file at the following location: "+ err.path);
							callback(customError);
						})

					})
					.catch((err) => {
						const customError = new errors.ConnectorErrorDownload(err.message);
						callback(customError);
					})

				});

			});

		}

		function doneDownloadingHandler()  {
			clearErrorTimeout();
			setlastMessageUUID(null);
			safeBrowserWindowSync((bw) => {
				bw.webContents.session.removeListener('will-download', willDownloadHandler);
			})
			callback();
			console.log('done downloading for service: ', serviceName);
		}


		safeBrowserWindowSync((bw) => {
			bw.webContents.session.on('will-download', willDownloadHandler);
		});
		bw.webContents.once('doneDownloading', doneDownloadingHandler);

		function _onErrorCleanUp(err) {
			winston.info('Cleaning up the onNextDownload cycle because we got the following error:', {err: err});
			bw.webContents.removeListener('doneDownloading', doneDownloadingHandler);
			safeBrowserWindowSync((bw) => {
				bw.webContents.session.removeListener('will-download', willDownloadHandler);
			})
			setlastMessageUUID(null);
		}
	}

	function scheduleErrorTimeout() {

		// _errorTimeout = setTimeout(((localTimeCounter) => {
		// 	return () => {
		// 		if (callback) {
		// 			callback();
		// 		}
		// 		const err = new errors.ConnectorErrorTimeOut("We got a timeout error. localTimeCounter is: "+localTimeCounter)
		// 		self.emitter.emit('error', err);
		// 	}
		// })(timeoutCounter), config.clientSideTimeout);
		// _errorTimeout.customID = timeoutCounter++;
		// winston.info("scheduleTimeoutMessage: ", _errorTimeout.customID);
	}

	function clearErrorTimeout() {
		// if (_errorTimeout !== null) {
		// 	winston.info('Clearing timeout %s', _errorTimeout.customID)
		// 	clearTimeout(_errorTimeout);
		// 	_errorTimeout = null;
		// } else {
		// 		winston.error("We can't clear the timeout because we have no timeout scheduled :/")
		// }
	}


	this.cleanup = function() {
		winston.info('cleaning the browswer automation object');
		bw.canReceiveOrder = true;
	}

	function getBillDirectory(serviceName, dateStr, username, subAccount) {
		var p = destinationFolder +"/hellobill/"+dateStr+"/"+serviceName+"/"+username+"/";
		if (subAccount && subAccount.length > 0) {
			p += subAccount+"/";
		}

		return p;
	}

	this.getURL = function() {
		return bw.getURL();
	}

	bluebird.promisifyAll(this);
}

module.exports = mainRunner;
