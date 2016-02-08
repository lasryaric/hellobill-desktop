'use strict';

function runnerClick(cssSelector, originalMessage, callback) {

	var domElemement = document.querySelectorAll(cssSelector)

	console.log('runnerClick: ', cssSelector)
	if (!domElemement || domElemement.length === 0) {
		console.log('runnerClick: could not click on element!:', cssSelector)
		callback(new Error('could not find css element:'+cssSelector), originalMessage);

		return ;
	}

	domElemement[0].click();

	console.log('runnerClick:clicked! ', cssSelector)
	// callback(null, originalMessage);
	callback(null, originalMessage, null);
}

function runnerDeepClick(firstCss, parentSteps, secondCss, originalMessage, callback) {
  //document.querySelectorAll("time[title^='2016-01']")[0].parentElement.parentElement.querySelectorAll(".receipt a")[0]
	console.log('runnerDeepClick')
  const firstStage = document.querySelectorAll(firstCss);

  var parents = window.__hellobill._.map(firstStage, function(elem) {
    var newElem = elem;

    for (var i = 0; i < parentSteps; i++) {
      if (newElem && newElem.parentElement) {
      	newElem = newElem.parentElement;
			}
    }

    return newElem;
  });

	var clickedOn = 0;
  window.__hellobill._.each(parents, (parentElem) => {
    var clickable = parentElem.querySelectorAll(secondCss);
    if (clickable && clickable.length > 0) {
			console.log('runnerDeepClick clicking on:', firstCss, secondCss, clickedOn)
      clickable[0].click();
			clickedOn++;
    }
  });
	const result = {
		clickedOn: clickedOn
	};
	if (clickedOn === 0) {
		callback(new Error('could not find css element:'+firstCss+','+secondCss), originalMessage);

		return ;
	}

  callback(null, originalMessage, result);
}
//

function runnerTypeText(cssSelector, text, originalMessage, callback) {

	var domElemement = document.querySelectorAll(cssSelector)

	console.log('runnerClick: ', cssSelector)
	if (!domElemement || domElemement.length === 0) {
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

function runnerGetInnerHTML(cssSelector, originalMessage, callback) {
	var elems = document.querySelectorAll(cssSelector);


	var texts = window.__hellobill._.map(elems, function(elem) {
		return elem.innerHTML;
	})

	callback(null, originalMessage, texts);
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

function runnerWaitForCss(cssSelector, originalMessage, callback) {
	var called = 0;

	function checkit() {
		var domElemement = document.querySelectorAll(cssSelector);

		if (domElemement.length > 0) {
			callback(null, originalMessage);

			return ;
		} else if (called < 10) {
			setTimeout(checkit, 500);
			called++;
		} else {
			callback(new Error('runnerWaitForCss: could not find cssSelector: '+cssSelector), originalMessage);
		}
	}

	checkit();

}

function runnerDownload(serviceName, date, originalMessage) {
	const downloader = window.__hb.downloaders[serviceName];

	remoteLog('runnerDownload with serviceName: '+ serviceName+' date:' + date)
	downloader.download(date);
}

function whenDone(error, originalMessage, data) {

	data = data || {};
	var messageName = 'doneExecuting';
	if (error) {
		messageName = 'couldNotExecute';
	}
	remoteLog('whenDone is Sending: messageName, data, originalMessage' + messageName+' data: '+JSON.stringify(data)+', originalMessage:'+JSON.stringify(originalMessage));

	window.__hellobill.ipc.send(messageName, data);
}

function remoteLog(message) {
	window.__hellobill.ipc.send('remoteLog',  {
		message: message
	})
}

function __hellobillLoop() {
	console.log('starting hellobill runLoop')

	window.__hellobill.ipc.on('invokeAction', function(event, message) {


	console.log('got a message from main process:', message)
	// console.log('message', message);


	if ( message.action === 'click') {
		runnerClick(message.cssSelector, message, whenDone);
	} else if (message.action === 'typeText') {
		runnerTypeText(message.cssSelector, message.text, message, whenDone);
	} else if (message.action === 'goto') {
		runnerGoto(message.url, message, whenDone);
	} else if (message.action === 'getInnerHTML') {
		runnerGetInnerHTML(message.cssSelector, message, whenDone)
	} else if (message.action === 'elementExists') {
		runnerElementExists(message.cssSelector, message, whenDone)
	} else if (message.action === 'clickDeep') {
		runnerDeepClick(message.firstCss, message.parentSteps, message.secondCss, message, whenDone);
	} else if (message.action ==='waitForCss') {
		runnerWaitForCss(message.cssSelector, message, whenDone)
	} else if (message.action === 'getAttribute') {
		runnerGetAttribute(message.cssSelector, message.attribute, message, whenDone);
	} else if (message.action === 'waitForDownload') {
		runnerDownload(message.service, message.date, message, whenDone);
	} else {
		console.log('got an unknown message:', message);
	}
	});
}

window.__hellobill = {};
window.__hellobill.ipc = require('electron').ipcRenderer;
window.__hellobill.utils = require('./ClientSideDownloader/utils')
window.__hellobill.runLoop = __hellobillLoop;
window.__hellobill._ = require('lodash');

window.__hb = {};
window.__hb.downloaders = require('./ClientSideDownloader/Downloaders');
