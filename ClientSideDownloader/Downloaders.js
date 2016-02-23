
const adobe = require('./AdobeDownloader')
const github = require('./GithubDownloader')
const skype = require('./SkypeDownloader')
const awsmain = require('./AwsmainDownloader')

module.exports = {
  adobe: adobe,
  github: github,
  skype: skype,
  awsmain: awsmain,
};
