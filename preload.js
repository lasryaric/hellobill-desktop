const ipcRenderer = require('electron').ipcRenderer;


function runnerClick(cssSelector, originalMessage, callback) {
	
	var domElemement = document.querySelectorAll(cssSelector)

	console.log('runnerClick: ', cssSelector)
	if (!domElemement || domElemement.length == 0) {
		callback(new Error("dom element not found for css selector: "+ cssSelector));

		return ;
	}

	domElemement[0].click();
	
	console.log('runnerClick:clicked! ', cssSelector)
	callback(null, originalMessage);
}

function runnerTypeText(cssSelector, text, originalMessage, callback) {
	
	var domElemement = document.querySelectorAll(cssSelector)

	console.log('runnerClick: ', cssSelector)
	if (!domElemement || domElemement.length == 0) {
		callback(new Error("dom element not found for css selector: "+ cssSelector));

		return ;
	}

	domElemement[0].value = text;
	callback(null, originalMessage);
}

function runnerGoto(url, originalMessage, callback) {
	window.location = url;

	callback(null, originalMessage);
}


function whenDone(error, originalMessage) {
	
	
	__hellobill.ipc.send('doneExecuting');
	
	
}

function __hellobillLoop() {
	console.log('starting hellobill runLoop')

	__hellobill.ipc.on('invokeAction', function(event, message) {
		
		
	console.log('got a message from main process:', message)
	// console.log('message', message);
	

	if ( message.action == 'click') {
		runnerClick(message.cssSelector, message, whenDone);
	} else if (message.action == 'typeText') {
		runnerTypeText(message.cssSelector, message.text, message, whenDone);
	} else if (message.action == 'goto') {
		runnerGoto(message.url, message, whenDone);
	} else {
		console.log('got an unknown message:', message);
	}


	});
}

window.__hellobill = {};
window.__hellobill.ipc = require('electron').ipcRenderer;
window.__hellobill.runLoop = __hellobillLoop;

