'use strict';

const winston = require('winston')
const axios = require('axios');

function sendMessage(message) {
  const url = process.env.WEBAPP_STARTING_POINT+'/api/slack/sendmessage';

  return axios
  .post(url, {
    message: message
  })
  .catch((err) => {
    winston.error('could not log to slack the following message:', {message:message, err:err.message})
  })
}

exports.sendMessage = sendMessage;
