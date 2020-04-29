"use strict";
exports.__esModule = true;
var MultiListenable = /** @class */ (function () {
    function MultiListenable() {
        this.listenerIdCounter = 0;
        this.listenerIdEventMap = {}; //Maps listenerID to the event it's listening for
        this.eventListeners = {}; //Maps eventName to a list of registered callbacks
    }
    //Register an event listener
    MultiListenable.prototype.on = function (eventName, callback) {
        var listenerId = this.listenerIdCounter++;
        this.listenerIdEventMap[listenerId] = eventName;
        if (!(eventName in this.eventListeners)) {
            this.eventListeners[eventName] = [];
        }
        this.eventListeners[eventName].push(new MultiListenable.EventCallback(listenerId, callback));
        return listenerId;
    };
    //Register an event listener that will be fired only once
    MultiListenable.prototype.one = function (eventName, callback) {
        var _this = this;
        //Modify the callback to unregister the event
        var modifiedCallback = function (ev) {
            _this.off(listenerId);
            callback(ev);
        };
        var listenerId = this.on(eventName, modifiedCallback);
        return listenerId;
    };
    //Unregister an event listener
    MultiListenable.prototype.off = function (listenerId) {
        //Find the event that this listener is subscribed to
        var eventName = this.listenerIdEventMap[listenerId];
        if (eventName == null) {
            return; //This listener has probably already been cancelled
        }
        var eventListenerList = this.eventListeners[eventName];
        if (eventListenerList == null) {
            return; //No listeners have been registered for this event
        }
        //Remove the callback from eventListeners
        for (var i = 0; i < eventListenerList.length; i++) {
            var event_1 = eventListenerList[i];
            if (event_1.id === listenerId) {
                eventListenerList.splice(i, 1);
                break;
            }
        }
        delete this.listenerIdEventMap[listenerId];
    };
    MultiListenable.prototype.cancelAllListeners = function () {
        this.eventListeners = {};
    };
    MultiListenable.prototype.isListenerFor = function (eventName) {
        return this.eventListeners[eventName] != null;
    };
    MultiListenable.prototype.fireEvent = function (eventName, eventData) {
        var callbackList = this.eventListeners[eventName];
        if (callbackList != null) {
            for (var i = 0; i < callbackList.length; i++) {
                var callback = callbackList[i].callback;
                callback(eventData);
            }
        }
    };
    return MultiListenable;
}());
exports.MultiListenable = MultiListenable;
(function (MultiListenable) {
    var EventCallback = /** @class */ (function () {
        function EventCallback(id, callback) {
            this.id = id;
            this.callback = callback;
        }
        return EventCallback;
    }());
    MultiListenable.EventCallback = EventCallback;
    ;
})(MultiListenable = exports.MultiListenable || (exports.MultiListenable = {}));
exports.MultiListenable = MultiListenable;
