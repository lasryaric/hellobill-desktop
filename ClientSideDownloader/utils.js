const moment = require('moment');
const resemble = require('resemblejs');
const bluebird = require('bluebird');
const range = require('moment-range')
const _ = require('lodash');
const axios = require('axios');


module.exports = {
  _: _,
  moment: moment,
  resemble: resemble,
  range: range,
  bluebird: bluebird,
  axios: axios,
}
