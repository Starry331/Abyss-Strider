export class GameLoop {
    constructor(update, draw) {
        this.update = update;
        this.draw = draw;
        this.lastTime = 0;
        this.isRunning = false;
        this.rafId = null;
    }

    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.lastTime = performance.now();
        this.loop = this.loop.bind(this);
        this.rafId = requestAnimationFrame(this.loop);
    }

    stop() {
        this.isRunning = false;
        if (this.rafId) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
        }
    }

    loop(timestamp) {
        if (!this.isRunning) return;

        const deltaTime = (timestamp - this.lastTime) / 1000; // Convert to seconds
        this.lastTime = timestamp;

        this.update(deltaTime);
        this.draw();

        this.rafId = requestAnimationFrame(this.loop);
    }
}
