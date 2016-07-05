'use strict';

const winston = require('winston')
const axios = require('axios');

function sendMessage(message,channel) {
  const url = process.env.WEBAPP_STARTING_POINT+'/api/slack/sendmessage';
  var channel = channel || '#metrics';

  return axios
  .post(url, {
    channel: channel,
    message: message,
  })
  .catch((err) => {
    winston.error('could not log to slack the following message:', {message:message, err:err.message})
  })
}

exports.sendMessage = sendMessage;
