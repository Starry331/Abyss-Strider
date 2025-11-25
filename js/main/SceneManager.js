export class SceneManager {
    constructor(ctx) {
        this.ctx = ctx;
        this.currentScene = null;
        this.scenes = {};
    }

    addScene(name, scene) {
        this.scenes[name] = scene;
    }

    switchTo(name) {
        if (this.currentScene && this.currentScene.exit) {
            this.currentScene.exit();
        }
        this.currentScene = this.scenes[name];
        if (this.currentScene && this.currentScene.enter) {
            this.currentScene.enter();
        }
    }

    update(deltaTime) {
        if (this.currentScene && this.currentScene.update) {
            this.currentScene.update(deltaTime);
        }
    }

    draw() {
        if (this.currentScene && this.currentScene.draw) {
            this.currentScene.draw(this.ctx);
        }
    }
}
