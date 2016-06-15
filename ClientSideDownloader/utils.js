const moment = require('moment');
const resemble = require('resemblejs');
const bluebird = require('bluebird');
const range = require('moment-range')
const _ = require('lodash');


module.exports = {
  _: _,
  moment: moment,
  resemble: resemble,
  range: range,
  bluebird: bluebird,
}
