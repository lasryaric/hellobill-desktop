'use strict';

const electronRemote = require('electron').remote;



function runnerClick(cssSelector, originalMessage, callback) {

	var domElemement = document.querySelectorAll(cssSelector)

	console.log('runnerClick: ', cssSelector)
	if (!domElemement || domElemement.length === 0) {
		console.log('runnerClick: could not click on element!:', cssSelector)
		callback(new Error('could not find css element:'+cssSelector), originalMessage);

		return ;
	}

	console.log('runnerClick:clicked! ', cssSelector)
	// callback(null, originalMessage);
	callback(null, originalMessage, null);

	setTimeout(() => {
		domElemement[0].click();
	}, 200)
}

function runnerClickAll(cssSelector, originalMessage, callback) {

	var domElemement = document.querySelectorAll(cssSelector)

	console.log('runnerClickAll: ', cssSelector)
	if (!domElemement || domElemement.length === 0) {
		console.log('runnerClickAll: could not click on element!:', cssSelector)
		callback(new Error('could not find css element:'+cssSelector), originalMessage);

		return ;
	}

	for (var i = 0; i < domElemement.length; i++) {
		domElemement[i].click();
	}


	console.log('runnerClickAll:clicked! ', cssSelector)
	// callback(null, originalMessage);
	callback(null, originalMessage, null);
}


function runnerTypeText(cssSelector, text, originalMessage, callback) {

	var domElemement = document.querySelectorAll(cssSelector)

	console.log('runnerTypeText: ', cssSelector)
	if (!domElemement || domElemement.length === 0) {
		callback(new Error("runnerTypeText: dom element not found for css selector: "+ cssSelector), originalMessage);

		return ;
	}

	domElemement[0].value = text;
	callback(null, originalMessage);
}


function runnerGoto(url, originalMessage, callback) {
	window.location = url;
}


function runnerGotoInApp(url, originalMessage, callback) {

	setTimeout(() => {
		window.location = url;
	}, 1);

	callback(null, originalMessage);
}

function runnerGetInnerHTML(cssSelector, originalMessage, callback) {
	var elems = document.querySelectorAll(cssSelector);


	var texts = window.__hellobill._.map(elems, function(elem) {
		return elem.innerHTML;
	})

	callback(null, originalMessage, texts);
}

function runnerGetMiddlePosition(cssSelector, originalMessage, callback) {
	const elem = document.querySelector(cssSelector);
	if (!elem) {
		callback(new Error("runnerGetMiddlePosition: dom element not found for css selector: "+ cssSelector), originalMessage, callback);
		return ;
	}
	const rect = elem.getBoundingClientRect();
	const result = {
		left: rect.left,
		top: rect.top,
	};
	whenDone(null, originalMessage, result);
}

function runnerGetAttribute(cssSelector, attribute, originalMessage, callback) {

	var elems = document.querySelectorAll(cssSelector);


	var texts = window.__hellobill._.map(elems, function(elem) {
		return elem[attribute]
	})

	callback(null, originalMessage, texts);
}


function runnerElementExists(cssSelector, originalMessage, callback) {
	var domElemement = document.querySelectorAll(cssSelector)
	var elementExists = false;

	console.log('runnerElementExists: ', cssSelector)
	if (domElemement && domElemement.length > 0) {
		elementExists = true;
	}

	console.log('runnerElementExists: ', cssSelector, elementExists)
	// callback(null, originalMessage);

	callback(null, originalMessage, {
		elementExists: elementExists
	});
}

function runnerWaitForCssMulti(csss, silent, timeout, originalMessage, callback) {
	var called = 0;
	const cssStringified = JSON.stringify(csss)
	const retryMs = 500;
	const retryMax = parseInt(timeout / retryMs);


	function checkit() {

		var elementExists = null;
		var foundAny = false;
		if (typeof(csss) !== "string") {
			const results = {};
			window.__hb._.forEach(csss, (v, k) => {
				const search = !!(document.querySelector(v));
				if (true === search) {
					foundAny = true;
				}

				results[k] = search;
			})

			elementExists = {ex: results};
		} else {
			foundAny = !!(document.querySelector(csss));
			elementExists = { elementExists: foundAny, ex: foundAny};
		}

		if (foundAny) {

			elementExists.elementExists = true;
			callback(null, originalMessage, elementExists);

			return ;
		} else if (called < retryMax) {

			remoteLog('runnerWaitForCss: Did not find ' + cssStringified+', called: '+called+'/'+retryMax);
			setTimeout(checkit, retryMs);
			called++;
		} else if (silent === false) {
			callback(new Error('runnerWaitForCss: could not find cssSelector: '+cssStringified), originalMessage);
		} else {
			elementExists.elementExists = false;
			callback(null, originalMessage, elementExists);
		}
	}

	checkit();
}

function runnerDownload(serviceName, date, originalMessage) {
	const downloader = window.__hb.downloaders(serviceName);
	var downloadOffset = 0;

	function doneDownloading() {
		window.__hellobill.ipc.removeListener('downloadNext', downloadNextHandler);
		window.__hellobill.ipc.send('doneDownloading');
	}

	function downloadNextHandler() {
		downloadOffset++;
		console.log('calling download next handler with ', downloadOffset)
		downloader.download(date, downloadOffset, doneDownloading, downloadNextHandler);
	}

	window.__hellobill.ipc.on('downloadNext', downloadNextHandler);

	remoteLog('runnerDownload with serviceName: '+ serviceName+' date:' + date)
	downloader.download(date, 0, doneDownloading, downloadNextHandler);
}

function executeClientSideFunction(serviceName, data, functionName, originalMessage, callback) {
	const downloader = window.__hb.downloaders(serviceName);

	remoteLog('functionName with serviceName: '+ serviceName+' data:' + data+' functioName:' + functionName);
	downloader[functionName](data)
	.then((result) => {
		callback(null, originalMessage, result);
	})
	.catch((err) => {
		callback(err, originalMessage);
	})
}

function whenDone(error, originalMessage, resultData) {

	var data = {};
	data['result'] = resultData;
	var messageName = 'doneExecuting';
	if (error) {
		console.log('ok we are sending an error now!', data)
		data.errorMessage = error.message;
	}
	data.originalMessageUUID = originalMessage.messageUUID;
	removeLastMessage();

	window.__hellobill.ipc.send(messageName, data);
	// remoteLog('whenDone is Sending: messageName, data, originalMessage: ' + messageName+' data: '+JSON.stringify(data)+', originalMessage:'+JSON.stringify(originalMessage));



}

function remoteLog(message) {
	window.__hellobill.ipc.send('remoteLog',  {
		message: message
	})
}



function saveLastMessage(message) {
	electronRemote.getGlobal('saveRendererMessage')(message);
}

function getLastMessage() {
	var f =  electronRemote.getGlobal('getRendererMessage');
	var result = f();

	return result;
}

function removeLastMessage() {
	return electronRemote.getGlobal('removeRendererMessage')();
}

function __hbGotMessage(message) {


	console.log('got a message from main process:', message)
	saveLastMessage(message);


	if ( message.action === 'click') {
		runnerClick(message.cssSelector, message, whenDone);
	} else if (message.action === 'clickAll') {
		runnerClickAll(message.cssSelector, message, whenDone);
	} else if (message.action === 'typeText') {
		runnerTypeText(message.cssSelector, message.text, message, whenDone);
	} else if (message.action === 'goto') {
		runnerGoto(message.url, message, whenDone);
	} else if (message.action === 'gotoInApp') {
		runnerGotoInApp(message.url, message, whenDone);
	} else if (message.action === 'getInnerHTML') {
		runnerGetInnerHTML(message.cssSelector, message, whenDone)
	} else if (message.action === 'elementExists') {
		runnerElementExists(message.cssSelector, message, whenDone)
	}  else if (message.action ==='waitForCss') {
		runnerWaitForCssMulti(message.cssSelector, message.silent, message.timeoutMS, message, whenDone)
	} else if (message.action === 'getAttribute') {
		runnerGetAttribute(message.cssSelector, message.attribute, message, whenDone);
	} else if (message.action === 'waitForDownload') {
		runnerDownload(message.service, message.date, message, whenDone);
	} else if (message.action === 'clientSideFunction') {
		executeClientSideFunction(message.service, message.data, message.functionName, message, whenDone)
	} else if(message.action === 'getMiddlePosition') {
		runnerGetMiddlePosition(message.cssSelector, message, whenDone)
	} else {
		console.log('got an unknown message:', message);
	}
}

function __hellobillLoop() {

	var timeoutMessageRecovery = setTimeout(() => {

		var savedMessage = getLastMessage();
		if (savedMessage) {
			__hbGotMessage(savedMessage);
		}
	}, 3000);

	window.__hellobill.ipc.on('invokeAction', function(event, message) {
		clearTimeout(timeoutMessageRecovery);
		__hbGotMessage(message);
	});
	window.__hellobill.ipc.sendSync('RunloopStarted');
}


window.__hellobill = {};
window.__hellobill.ipc = require('electron').ipcRenderer;
window.__hellobill.utils = require('./ClientSideDownloader/utils')
window.__hellobill.runLoop = __hellobillLoop;
window.__hellobill._ = require('lodash');

window.__hb = {};
window.__hb.downloaders = require('./ClientSideDownloader/Downloaders');
window.__hb.remoteLog = remoteLog;
window.__hb._ = require('lodash');

// window.onload = function() {
window.addEventListener('load', function() {

	window.__hellobill.runLoop();
});
