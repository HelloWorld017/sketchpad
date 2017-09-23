import EventEmitter from 'events';

class World extends EventEmitter {
	constructor(renderer, {background, updateTick, fps}){
		super();
		this.screen = renderer.screen;
		this.renderer = renderer;
		this.objects = [];
		this.creationCache = [];
		this.objectsCache = [];
		this.renderWorld = this.render.bind(this);
		this.updateWorld = this.update.bind(this);
		this.previousRender = -1000;
		this.fpsInterval = 1000 / fps;
		this.updateTick = updateTick;
		this.background = renderer.requestUnsafeContext((ctx) => {
			return background(ctx, renderer.screen);
		});

		this.configs = {};

		this.id = Date.now() + "-" + Math.random();
	}

	addObjectToWorld(object){
		this.creationCache.push(object);
	}

	bindToRenderer(){
		this.renderer.bind(this.id);
	}

	unbindFromRenderer(){
		this.renderer.unbind(this.id);
	}

	render(timestamp){
		requestAnimationFrame(this.renderWorld);
		const elapsed = timestamp - this.previousRender;
		if(elapsed < this.fpsInterval){
			return;
		}
		this.previousRender = timestamp - (elapsed % this.fpsInterval);

		this.renderer.runOnUiContext(this.id, (ctx, canvas) => {
			ctx.clearRect(0, 0, canvas.width, canvas.height);
			ctx.fillStyle = this.background;
			ctx.fillRect(0, 0, canvas.width, canvas.height);
			this.objects.forEach((v) => v.render(ctx));
		});
	}

	update(){
		this.objects = this.objects
			.filter((v) => v.update() !== false)
			.concat(this.creationCache);
		this.creationCache = [];
		setTimeout(this.updateWorld, this.updateTick);
	}

	refreshSettings() {
		this.emit('settings.refresh');
	}

	init(){
		this.render(0);
		this.update();
	}

	getCanvas(){
		return this.canvas;
	}
}

export default World;
