const ipcMain = require('electron').ipcMain;

const messageName = 'invokeAction';

function mainRunner(bw) {

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

	this.waitForPage = function(callback) {
		onNextPageLoad(callback);
	}

	this.waitOnCurrentThread = function(callback) {
		setTimeout(callback, 100);
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
		ipcMain.once('doneExecuting', function(event, arg) {
			console.log('got done doneExecuting message');
			setTimeout(callback, 0);
			
		});		
	}

	function onNextPageLoad(callback) {
		bw.webContents.once('did-finish-load', function() {
			setTimeout(callback, 0);
		});
	}
}

module.exports = mainRunner;
