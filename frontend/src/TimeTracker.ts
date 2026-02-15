
class TimeTracker {
    private startTime: number | null = null;
    private endTime: number | null = null;

    start() {
        this.startTime = Date.now();
        this.endTime = null;
    }

    stop() {
        if (this.startTime !== null) {
            this.endTime = Date.now();
        }
    }

    getElapsedTime(): number | null {
        if (this.startTime !== null && this.endTime !== null) {
            return this.endTime - this.startTime;
        }
        return null;
    }
}

export default TimeTracker;
