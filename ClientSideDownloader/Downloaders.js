
const adobe = require('./AdobeDownloader')
const github = require('./GithubDownloader')
const skype = require('./SkypeDownloader')

module.exports = {
  adobe: adobe,
  github: github,
  skype: skype,
};
