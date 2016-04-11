
const adobe = require('./AdobeDownloader')
const github = require('./GithubDownloader')
const skype = require('./SkypeDownloader')
const awsmain = require('./AwsmainDownloader')
const amazon = require('./AmazonDownloader')
const amazonfr = require('./AmazonfrDownloader')
const gandi = require('./GandiDownloader')
const bouygues = require('./BouyguesDownloader')
const uber = require('./UberDownloader')

module.exports = {
  adobe: adobe,
  github: github,
  skype: skype,
  awsmain: awsmain,
  uber: uber,
  amazon: amazon,
  amazonfr: amazonfr,
  gandi: gandi,
  bouygues: bouygues,
};
