export class ServerConnection {
    websocket = null;
    callbackMap = {}; //Maps a server event type to a callback
    openRequests = {}; //Maps a request ID to the request's promise

    heartBeatTimeout = null;
    heartbeat() {
        clearTimeout(this.heartBeatTimeout);

        this.heartBeatTimeout = setTimeout(() => this.websocket.close(), 10000 + 1500); //Server ping frequency + 1.5s wiggle
    }

    constructor(serverAddress) {
        this.websocket = new WebSocket(serverAddress);
        
        this.websocket.addEventListener('open', () => {
            console.info('%c ✅ Connected to Rerun server', 'color: green');
            this.heartbeat();
        });
        this.websocket.addEventListener('message', (event) => {
            if (event.data === 'ping') {
                this.heartbeat();
                return;
            }

            let serverEvent = JSON.parse(event.data);
            console.debug('Event from server: ' + serverEvent.eventName);
    
            if (serverEvent != null) {
                //Check if this is a response to an earlier request
                if (serverEvent.eventName === 'res') {
                    let responseData = serverEvent.data;
                    let reqPromise = this.openRequests[serverEvent.reqId];
                    
                    if (serverEvent.data.status === 'error') {
                        reqPromise.reject(responseData);
                    } else {
                        reqPromise.resolve(responseData);
                    }

                    delete this.openRequests[serverEvent.reqId];
                    return;
                }

                //Check if there's a callback registered for this message
                let callback = this.callbackMap[serverEvent.eventName];
                if (callback != null) {
                    callback(serverEvent.data);
                }
            }
        });
        this.websocket.addEventListener('close', () => {
            clearTimeout(this.heartBeatTimeout);
            console.error('Lost websocket connection to Rerun server');
        });
    }

    //Register message callback
    onMessage(messageName, callback) {
        this.callbackMap[messageName] = callback;
    }

    requestIDCounter = 0;
    //Send a request to the server. Returns a promise that resolves to the server's response
    request(requestName, data) {
        const requestID = this.requestIDCounter;
        this.requestIDCounter++;
        
        let resPromiseResovler;

        let resPromise = new Promise((resolve, reject) => resPromiseResovler = {resolve: resolve, reject: reject});

        this.openRequests[requestID] = resPromiseResovler;

        this.websocket.send(JSON.stringify({reqId: requestID, req: requestName, data: data}));

        return resPromise;
    }
}

export default ServerConnection;