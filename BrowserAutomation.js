const ipcMain = require('electron').ipcMain;

const messageName = 'invokeAction';

function mainRunner(bw, serviceName) {

	var filenameNB = 0;

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

	this.clickAndWaitForDownload = function(cssSelector, fileName, callback) {
		const message = {
			action: 'click',
			cssSelector: cssSelector,
		};

		sendToBrowser(message);
		onNextDownload(fileName, callback);
	}

	this.clickDeepAndWaitForDownload = function(firstCss, parentSteps, secondCss, fileName, callback) {
		const message = {
			action: 'clickDeep',
			firstCss: firstCss,
			parentSteps: parentSteps,
			secondCss: secondCss
		};

		sendToBrowser(message);
		onNextDownload(fileName, callback);
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

	this.gotoAndWaitForDownload = function(url, fileName, callback) {
		const message = {
			action: 'goto',
			url: url
		};

		sendToBrowser(message);
		onNextDownload(fileName, callback);
	}

	this.waitForCss = function(cssSelector, callback) {
		const message = {
			action: 'waitForCss',
			cssSelector: cssSelector
		}

		sendToBrowser(message);
		onNextActionCompleted(callback);
	}

	function sendToBrowser(data) {
		console.log('sending message to browser: ', messageName, data)
		if (bw.canReceiveOrder == true) {
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
		};

		bw.webContents.once('did-finish-load', didLoadFinishHandler);

		//ipcMain.once('couldNotExecute', couldNotExecuteHandler);
	}

	function onNextDownload(targetFileName, callback) {

		function willDownloadHandler(event, item, webContents) {
			event.preventDefault();
			console.log('will download!');


			var url = require('url')
			var request = require('request');

			var fileURL = url.parse(item.getURL());
			var headers = {
				"Cookie": null
			}

			bw.webContents.session.cookies.get({}, function(err, cookies) {
				// console.log('cookies:', cookies, fileURL)
				var ca = cookies.map(function(v) {

					return v.name+"="+v.value;
				});

				if (ca) {
					headers["Cookie"] = ca.join(';');
				}

				var fs = require('fs');
				var requestOptions = {
					uri: fileURL.href,
					headers: headers
				}

				const fileFullPath = __dirname+"/downloads/"+targetFileName;
				console.log('lets go download :', requestOptions)
				request(requestOptions).pipe(fs.createWriteStream(fileFullPath)).on('close', function() {
					console.log('DONE downloading!', fileFullPath);
					bw.canReceiveOrder = true;
					callback(null, fileFullPath);
				});

			});

			ipcMain.removeListener('couldNotExecute', couldNotExecuteHandler);
		}

		function couldNotExecuteHandler() {
			bw.webContents.session.removeListener('will-download', willDownloadHandler);
			setTimeout(callback, 0);

		}

		bw.webContents.session.once('will-download', willDownloadHandler);
		ipcMain.once('couldNotExecute', couldNotExecuteHandler);
	}
}

module.exports = mainRunner;
