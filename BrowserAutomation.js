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

	this.clickAndWaitForDownload = function(cssSelector, callback) {
		const message = {
			action: 'click',
			cssSelector: cssSelector,
		};

		sendToBrowser(message);
		onNextDownload(callback);
	}

	this.clickDeepAndWaitForDownload = function(firstCss, parentSteps, secondCss, callback) {
		const message = {
			action: 'clickDeep',
			firstCss: firstCss,
			parentSteps: parentSteps,
			secondCss: secondCss
		};

		sendToBrowser(message);
		onNextDownload(callback);
	}

	this.getInnerHTML = function(cssSelector, callback) {
		const message = {
			action: 'getInnerHTML',
			cssSelector: cssSelector
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

	this.waitOnCurrentThread = function(callback) {
		setTimeout(callback, 3000);
	}

	this.goto = function(url, callback) {
		const message = {
			action: 'goto',
			url: url
		};

		sendToBrowser(message);
		onNextPageLoad(callback);
	}

	function sendToBrowser(data) {
		bw.send(messageName, data);
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
		bw.webContents.once('did-finish-load', function() {
			setTimeout(callback, 0);
		});
	}

	function onNextDownload(callback) {
		bw.webContents.session.once('will-download', function(event, item, webContents) {
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

				var filename = serviceName+"-"+filenameNB+".pdf";
				filenameNB++;

				filename = __dirname+"/"+filename;
				console.log('lets go download :', filename)
				request(requestOptions).pipe(fs.createWriteStream(filename)).on('close', function() {
					console.log('DONE downloading!', filenameNB);
					callback(null, filename);
				});

			});
		});
	}
}

module.exports = mainRunner;
