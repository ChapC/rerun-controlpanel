export class ServerConnection {
    websocket = null;
    listenerMap = {}; //Maps a server event type to a list of listeners
    openRequests = {}; //Maps a request ID to the request's promise

    heartBeatTimeout = null;
    heartbeat() {
        clearTimeout(this.heartBeatTimeout);

        this.heartBeatTimeout = setTimeout(() => this.websocket.close(), 5000 + 1500); //Server ping frequency + 1.5s wiggle

        this.websocket.send('pong');
    }

    queuedForSend = [];

    constructor(serverAddress) {
        this.websocket = new WebSocket(serverAddress);
        
        this.websocket.addEventListener('open', () => {
            console.info('%c ✅ Connected to Rerun server', 'color: green');

            //Send any queued messages
            for (let message of this.queuedForSend) {
                this.websocket.send(message);
            }
            this.queuedForSend = [];

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
                let callbackList = this.listenerMap[serverEvent.eventName];
                if (callbackList != null) {
                    for (let callback of callbackList) {
                        callback.accept(serverEvent.data);
                    }
                }
            }
        });
        this.websocket.addEventListener('close', () => {
            clearTimeout(this.heartBeatTimeout);
            console.error('Lost websocket connection to Rerun server');
        });
    }

    listenerIdCounter = 0;
    //Register message callback
    addMessageListener(messageName, callback) {
        let listenerId = this.listenerIdCounter++;
        let messageListeners = this.listenerMap[messageName];
        if (messageListeners == null) {
            this.listenerMap[messageName] = [];
            messageListeners = this.listenerMap[messageName];
        }
        this.listenerMap[messageName].push({id: listenerId, accept: callback});
        return {messageName: messageName, id: listenerId};
    }

    removeMessageListener(listener) {
        for (let i = 0; i < this.listenerMap[listener.messageName].length; i++) {
            const l = this.listenerMap[listener.messageName][i];
            if (l.id === listener.id) {
                this.listenerMap[listener.messageName].splice(i, 1);
                return;
            }
        }
    }

    requestIDCounter = 0;
    //Send a request to the server. Returns a promise that resolves to the server's response
    request(requestName, data) {
        const requestID = this.requestIDCounter;
        this.requestIDCounter++;
        
        let resPromiseResovler;

        let resPromise = new Promise((resolve, reject) => resPromiseResovler = {resolve: resolve, reject: reject});

        this.openRequests[requestID] = resPromiseResovler;

        const message = JSON.stringify({reqId: requestID, req: requestName, data: data});
        if (this.websocket.readyState === 1) {
            this.websocket.send(message);
        } else {
            //Socket not yet connected, queue this message
            console.info('Request "' + requestName + '" was queued for sending - the websocket is not yet open');
            this.queuedForSend.push(message);
        } 


        return resPromise;
    }
}

export default ServerConnection;