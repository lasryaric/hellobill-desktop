const urlParser = require('url');
const AppConstants = require('./constants/AppConstants');

function onOpenURL(openURL, appWindow) {
  var parsedURL = urlParser.parse(openURL, true);
  const token = parsedURL.query.token;
  const escapedToken = encodeURIComponent(token);
  const nextURL = process.env.WEBAPP_STARTING_POINT + '/desktop/'+AppConstants.webVersion+'/app/account';
  const escapedNextURL = encodeURIComponent(nextURL);
  const url = process.env.WEBAPP_STARTING_POINT + "/api/user/regeneratesession?sessionID="+escapedToken+"&nextURL="+escapedNextURL;
  appWindow.loadURL(url);
  appWindow.focus();
}


module.exports = {
	onOpenURL: onOpenURL
};
