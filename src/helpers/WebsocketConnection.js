//Compiled version of WebsocketConnection.ts from Rerun server. Modified to work with browser websocket.
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
exports.__esModule = true;
var MultiListenable_1 = require("./MultiListenable");
/**
 * Simple WS protocol that allows two message types - requests and alerts.
 * Alerts are one-way notifications. The remote endpoint will not return a response for an alert.
 * Requests work like a typical web request. The remote endpoint will respond with a success or error response.
 *
 * Callbacks for alerts can be registered with onAlerts.
 * Handlers for requests are defined with addRequestHandler.
 * Websocket lifecycle callbacks are also provided via MultiListenable.
*/
var WSConnection = /** @class */ (function (_super) {
    __extends(WSConnection, _super);
    function WSConnection(ws) {
        var _this = _super.call(this) || this;
        _this.ws = ws;
        _this.queuedForSend = []; //Messages sent before the socket is opened will be queued
        _this.requestIDCounter = 0;
        _this.requestHandlers = {};
        _this.pendingRequests = {};
        ws.addEventListener('open', function () {
            //Send any queued messages
            _this.queuedForSend.forEach(function (message) { return _this.ws.send(message); });
            _this.queuedForSend = [];
            _this.fireEvent('open', null);
        });
        ws.addEventListener('message', function (msgEvent) {
            let rawMessage = msgEvent.data;
            if (rawMessage === 'ping') {
                return;
            }
            //Deserialize the message
            var message;
            try {
                message = JSON.parse(rawMessage.toString());
            }
            catch (e) {
                console.warn('Failed to parse Websocket message: ', message);
                return;
            }
            if (message != null) {
                if (Request.isInstance(message)) {
                    //Check if there is a handler for this request type
                    if (_this.requestHandlers[message.requestName] != null) {
                        //Pass the message to this handler
                        var response = void 0;
                        try {
                            response = _this.requestHandlers[message.requestName](message.data);
                        }
                        catch (error) {
                            console.error("Error inside request handler for " + message.requestName, error);
                            //Return a default error object to the client
                            response = new WSConnection.ErrorResponse('ServerError', 'An unexpected error occurred while processing this request.');
                        }
                        //Response is either a SuccessResponse, an ErrorResponse or a promise resolving to either
                        var processResponse_1 = function (response) {
                            if (WSConnection.SuccessResponse.isInstance(response)) {
                                var status_1 = 'okay';
                                if (response.status) { //If a custom status was defined by the request handler
                                    status_1 = response.status;
                                }
                                ws.send(JSON.stringify(new Response(message.reqId, status_1, response.message, response.data)));
                            }
                            else {
                                //It's an error
                                ws.send(JSON.stringify(new Response(message.reqId, 'error', response.message, null, response.code)));
                            }
                        };
                        //The handler returned a promise - process/send the response later
                        if (isPromise(response)) {
                            response.then(processResponse_1)["catch"](function (error) {
                                console.error("Error inside request handler promise for " + message.requestName, error);
                                //Return a default error object to the client
                                processResponse_1(new WSConnection.ErrorResponse('ServerError', 'An unexpected error occurred while processing this request.'));
                            });
                        }
                        else { //The handler returned immediately - process/send the response now
                            processResponse_1(response);
                        }
                    }
                    else {
                        //There is no handler for this request type
                        ws.send(JSON.stringify(new Response(message.reqId, 'error', "Unknown request type " + message.requestName + " ", null, 'UnknownRequest')));
                    }
                }
                else if (Alert.isInstance(message)) {
                    //Trigger any listeners waiting for this alert
                    _this.fireEvent('alert' + message.alertName, message.data);
                }
                else if (Response.isInstance(message)) { //A response to an earlier request
                    //Find the callback for this request
                    var callback = _this.pendingRequests[message.reqId];
                    if (callback == null) {
                        console.warn('Received response for unknown request with ID ' + message.reqId);
                        return;
                    }
                    delete _this.pendingRequests[message.reqId];
                    if (WSConnection.ErrorResponse.isInstance(message)) {
                        callback.reject(message);
                    }
                    else if (WSConnection.SuccessResponse.isInstance(message)) {
                        callback.resolve(message.data);
                    }
                }
            }
        });
        ws.addEventListener('error', function (error) { return _this.fireEvent('error', error); });
        ws.addEventListener('close', function (code, reason) { return _this.fireEvent('close', { code: code, reason: reason }); });
        return _this;
    }
    WSConnection.prototype.sendAlert = function (event, data) {
        this.ws.send(JSON.stringify(new Alert(event, data)));
    };
    WSConnection.prototype.getReqID = function () {
        this.requestIDCounter++;
        return this.requestIDCounter;
    };
    WSConnection.prototype.sendRequest = function (requestName, data) {
        var resPromiseResolver;
        //Pull the resolve and reject callbacks out of the promise
        var resPromise = new Promise(function (resolve, reject) { return resPromiseResolver = { resolve: resolve, reject: reject }; });
        //Store the resolver in pendingRequests
        var requestId = this.getReqID();
        this.pendingRequests[requestId] = resPromiseResolver;
        var request = JSON.stringify(new Request(requestId.toString(), requestName, data));
        if (this.ws.readyState === 1) { //Websocket is ready
            this.ws.send(request); //Send the message
        }
        else {
            //Socket not yet connected, queue this message
            console.info('Request "' + requestName + '" was queued for sending - the websocket is not yet open');
            this.queuedForSend.push(request);
        }
        return resPromise;
    };
    //Alert listeners use the normal MultiListenable but have "alert" prepended to the event name
    WSConnection.prototype.onAlert = function (alertName, callback) {
        return this.on('alert' + alertName, callback);
    };
    WSConnection.prototype.offAlert = function (callbackId) {
        this.off(callbackId);
    };
    WSConnection.prototype.oneAlert = function (alertName, callback) {
        return this.one('alert' + alertName, callback);
    };
    //Interested parties may register handlers for certain request types
    WSConnection.prototype.addRequestHandler = function (requestName, handler) {
        this.requestHandlers[requestName] = handler;
    };
    /**
     * Adds a request handler with a given type guard.
     * If a request's data doesn't pass the type guard, the request is automatically declined.
     */
    WSConnection.prototype.addGuardedRequestHandler = function (requestName, typeGuard, handler) {
        //Wrap the handler in a type guard check
        var wrappedHandler = function (data) {
            if (typeGuard(data)) {
                return handler(data);
            }
            else {
                return new WSConnection.ErrorResponse('InvalidType', 'Invalid data type for request');
            }
        };
        this.requestHandlers[requestName] = wrappedHandler;
    };
    WSConnection.prototype.clearRequestHandler = function (requestName) {
        delete this.requestHandlers[requestName];
    };
    WSConnection.prototype.isConnected = function () {
        return this.ws.readyState === 1;
    };
    return WSConnection;
}(MultiListenable_1.MultiListenable));
exports.WSConnection = WSConnection;
//Used internally
var Response = /** @class */ (function () {
    function Response(reqId, status, message, data, errorCode) {
        this.reqId = reqId;
        this.status = status;
        this.message = message;
        this.data = data;
        this.errorCode = errorCode;
    }
    Response.isInstance = function (something) {
        return (something.reqId != null && something.status != null);
    };
    return Response;
}());
var Request = /** @class */ (function () {
    function Request(reqId, requestName, data) {
        this.reqId = reqId;
        this.requestName = requestName;
        this.data = data;
    }
    Request.isInstance = function (something) {
        return (something.reqId != null && something.requestName != null);
    };
    return Request;
}());
var Alert = /** @class */ (function () {
    function Alert(alertName, data) {
        this.alertName = alertName;
        this.data = data;
    }
    Alert.isInstance = function (something) {
        return (something.alertName != null);
    };
    return Alert;
}());
function isPromise(something) {
    return (something.then != null && (typeof something.then) === 'function');
}
(function (WSConnection) {
    //Used by request handlers - they can return whichever one they need
    var SuccessResponse = /** @class */ (function () {
        function SuccessResponse(message, data, status) {
            this.message = message;
            this.data = data;
            this.status = status;
        }
        SuccessResponse.isInstance = function (something) {
            return (something.message != null && something.status !== 'error');
        };
        return SuccessResponse;
    }());
    WSConnection.SuccessResponse = SuccessResponse;
    var ErrorResponse = /** @class */ (function () {
        function ErrorResponse(code, message) {
            this.errorCode = code;
            this.message = message;
        }
        ErrorResponse.isInstance = function (something) {
            return (something.errorCode != null && something.reqId != null);
        };
        return ErrorResponse;
    }());
    WSConnection.ErrorResponse = ErrorResponse;
})(WSConnection = exports.WSConnection || (exports.WSConnection = {}));
exports.WSConnection = WSConnection;
