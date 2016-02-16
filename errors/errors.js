"use strict";

 class CustomError extends Error {
 	constructor(message) {
 		super(message);
 		this.name = this.constructor.name;
 		this.message = message;
 		this.isUserFriendly = false;
 		Error.captureStackTrace(this, this.constructor.name)
 	}
 }

 class ConnectorError extends Error {
 	constructor(message) {
 		super(message);
 		this.name = this.constructor.name;
 		this.message = message;

 		Error.captureStackTrace(this, this.constructor.name)
 	}
 }

 class ConnectorErrorCouldNotExecute extends Error {
   constructor(message) {
     super(message);
     this.name = this.constructor.name;
     this.message = message;
     this.modelConnector = 0;
     Error.captureStackTrace(this, this.constructor.name)
   }
 }

 class ConnectorErrorTimeOut extends Error {
   constructor(message) {
     super(message);
     this.name = this.constructor.name;
     this.message = message;
     this.modelConnector = 0;
     Error.captureStackTrace(this, this.constructor.name)
   }
 }

 class ConnectorErrorWrongCredentials extends Error {
   constructor(message) {
     super(message);
     this.name = this.constructor.name;
     this.message = message;
     this.modelConnector = 0;
     Error.captureStackTrace(this, this.constructor.name)
   }
 }


 class UserFriendlyError extends Error {
 	constructor(message, httpStatusCode) {
 		super(message);
 		this.name = this.constructor.name;
 		this.message = message;
 		this.httpStatusCode = httpStatusCode;
 		this.isUserFriendly = true;
 		Error.captureStackTrace(this, this.constructor.name)
 	}
 }

 class InputErrorUF extends UserFriendlyError {
 	constructor(message, httpStatusCode) {
 		httpStatusCode = httpStatusCode ? httpStatusCode : 400;
 		super(message, httpStatusCode);
 	}
 }

 exports.InputErrorUF = InputErrorUF;
 exports.ConnectorErrorCouldNotExecute = ConnectorErrorCouldNotExecute;
 exports.ConnectorErrorTimeOut = ConnectorErrorTimeOut;
 exports.ConnectorErrorWrongCredentials = ConnectorErrorWrongCredentials;
