
const adobe = require('./AdobeDownloader')
const github = require('./GithubDownloader')
const skype = require('./SkypeDownloader')
const awsmain = require('./AwsmainDownloader')
const amazon = require('./AmazonDownloader')
const amazonfr = require('./AmazonfrDownloader')
const gandi = require('./GandiDownloader')
const bouygues = require('./BouyguesDownloader')
const facebookads = require('./FacebookadsDownloader')
const uber = require('./UberDownloader')
const ovh = require('./OvhDownloader')
const dropbox = require('./DropboxDownloader')
const slack = require('./SlackDownloader')

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
  facebookads: facebookads,
  ovh: ovh,
  dropbox: dropbox,
  slack: slack,
};
