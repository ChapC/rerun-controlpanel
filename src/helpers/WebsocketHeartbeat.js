exports.__esModule = true;
var pingFrequency = 5000;
var WebsocketHeartbeat = /** @class */ (function () {
    function WebsocketHeartbeat(websocket) {
        var _this = this;
        this.heartBeatTimeout = null;
        this.heartbeat = function () {
            clearTimeout(_this.heartBeatTimeout);
            _this.heartBeatTimeout = setTimeout(function () { return _this.ws.close(); }, pingFrequency + 1500); //Server ping frequency + 1.5s wiggle
        };
        this.ws = websocket;
        this.ws.addEventListener('close', function () {
            clearInterval(_this.interval);
            clearTimeout(_this.heartBeatTimeout);
        });
        this.ws.addEventListener('message', this.heartbeat);
        this.interval = setInterval(function () {
            if (_this.ws.readyState === 1) {
                _this.ws.send('ping');
            }
            else {
                _this.ws.close();
            }
        }, pingFrequency);
        this.heartbeat();
    }
    return WebsocketHeartbeat;
}());
exports.WebsocketHeartbeat = WebsocketHeartbeat;
