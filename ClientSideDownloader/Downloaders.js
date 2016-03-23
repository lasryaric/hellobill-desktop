
const adobe = require('./AdobeDownloader')
const github = require('./GithubDownloader')
const skype = require('./SkypeDownloader')
const awsmain = require('./AwsmainDownloader')
const amazon = require('./AmazonDownloader')
const uber = require('./UberDownloader')

module.exports = {
  adobe: adobe,
  github: github,
  skype: skype,
  awsmain: awsmain,
  uber: uber,
  amazon: amazon,
};
