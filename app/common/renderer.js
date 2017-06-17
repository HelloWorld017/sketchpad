class Renderer{
	constructor(canvas){
		this._canvas = canvas;
		this._ctx = this._canvas.getContext('2d');
		this._bindedId = {};

		this.screen = {
			width: canvas.width,
			height: canvas.height
		};
	}

	bind(id){
		this._bindedId[id] = true;
	}

	unbind(id){
		this._bindedId[id] = false;
	}

	runOnUiContext(id, func){
		if(!this._bindedId[id]) return;

		return func(this._ctx, this._canvas);
	}

	async runOnUiContextAsync(id, func){
		if(!this._bindedId[id]) return;

		return await func(this._ctx, this._canvas);
	}

	requestUnsafeContext(func){
		return func(this._ctx, this._canvas);
	}

	static createMainRenderer(){
		const renderer = Renderer.createRenderer({
			width: window.innerWidth,
			height: window.innerHeight
		});

		renderer.requestUnsafeContext((ctx, canvas) => {
			canvas.style.position = 'fixed';
			canvas.style.left = '0';
			canvas.style.top = '0';
			canvas.style.width = '100vw';
			canvas.style.height = '100vh';
			canvas.style.bottom = '0';
			canvas.style.right = '0';

			document.body.append(canvas);
		});

		return renderer;
	}

	static createRenderer(screen){
		const canvas = document.createElement('canvas');
		canvas.width = screen.width;
		canvas.height = screen.height;

		return new Renderer(canvas);
	}
}

export default Renderer;
