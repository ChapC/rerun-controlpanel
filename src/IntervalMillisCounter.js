//Increments a millisecond counter at the specified frequency

export default class IntervalMillisCounter {
    frequencyMs;
    callback;

    running = false;

    constructor(frequencyMs, callback) {
        this.frequencyMs = frequencyMs;
        this.callback = callback;
    }

    currentCount = 0;
    startTime;
    interval;

    start(startValue) {
        clearInterval(this.interval); 
        
        if (!startValue) {
            this.currentCount = 0;
        } else {
            this.currentCount = startValue;
        }

        this.startTime = Date.now();
        this.interval = setInterval(this.tickUp, this.frequencyMs);
        this.running = true;
    }

    countDownFrom(startValue) {
        clearInterval(this.interval); 
        this.currentCount = startValue;
        this.startTime = Date.now();
        this.interval = setInterval(this.tickDown, this.frequencyMs);
        this.running = true;
    }

    stop() {
        clearInterval(this.interval);
        this.running = false;
    }

    tickUp = () => {
        //How much time has passed since the last tick?
        this.currentCount += (Date.now() - this.startTime);
        this.startTime = Date.now();
        this.callback(this.currentCount);
    }

    tickDown = () => {
        this.currentCount -= (Date.now() - this.startTime);
        this.startTime = Date.now();
        this.callback(this.currentCount);
    }

    getFrequencyMs() {
        return this.frequencyMs;
    }
}