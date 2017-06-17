import {AMSynth, Chorus, PingPongDelay, PolySynth} from "tone";
import Color from "color";
import Object from "../common/object";
import Renderer from "../common/renderer";
import World from "../common/world";

const filter = (initial, val) =>  (typeof val === 'undefined') ? initial : val;
const chorus = new Chorus(4, 2.5, 0.5).toMaster();
const pingpong = new PingPongDelay("64n", 0.2).connect(chorus);

const DEFAULT_SYNTH = new PolySynth(4, AMSynth).connect(pingpong);

class Rain extends Object{
	constructor(world, {
		x, y,
		bottom,
		speed, acceleration,
		width, height,
		angle,
		color,
		rippleAmount, rippleTick, rippleTimeout, rippleSize,
		sound
	}){
		super(world);
		const screen = world.screen;

		this.x = filter(Math.random() * screen.width, x);
		this.y = filter(-30, y);
		this.bottom = filter(screen.height, bottom);
		this.speed = filter(0, speed);
		this.acceleration = filter(10, acceleration);
		this.color = filter("rgba(255, 255, 255, .8)", color);
		this.width = filter(1, width);
		this.height = filter(15, height);
		this.angle = filter(90, angle) / 180 * Math.PI;
		this.rippleAmount = filter(2, rippleAmount);
		this.rippleTick = filter(10, rippleTick);
		this.rippleTimeout = filter(15, rippleTimeout);
		this.rippleSize = filter(screen.width / 100, rippleSize);
		this.sound = filter(523, sound);

		this.sizeVector = this.divideVector(this.height);
		this.alpha = Color(this.color).alpha();
	}

	update(){
		if(this.isDead) return false;
		this.speed += this.acceleration;
		this.move(this.speed);

		if(this.y >= this.bottom) {
			this.createRipple();
			return this.setDead();
		}
	}

	createRipple(){
		if(this.world.configs.soundEnabled && Math.random() < 0.05)
			DEFAULT_SYNTH.triggerAttackRelease(this.sound, '16n');

		for(let i = 0; i < this.rippleAmount; i++){
			const ripple = new Ripple(this.world, {
				x: this.x,
				y: this.y,
				color: this.color,
				width: this.width,
				timeout: this.rippleTimeout,
				size: this.rippleSize * this.speed / 50
			});

			setTimeout(() => {
				this.world.addObjectToWorld(ripple);
			}, i * this.rippleTick);
		}
	}

	render(ctx){
		if(this.isDead) return;
		ctx.strokeStyle = this.color;
		ctx.lineWidth = this.width;

		ctx.beginPath();
		ctx.moveTo(this.x, this.y);
		ctx.lineTo(this.x + this.sizeVector.x, this.y + this.sizeVector.y);
		ctx.stroke();
	}
}

class Ripple extends Object{
	constructor(world, {x, y, color, width, timeout, size}){
		super(world);
		this.x = filter(0, x);
		this.y = filter(0, y);
		this.color = Color(filter("rgba(255, 255, 255, .8)", color));
		this.alpha = this.color.alpha();
		this.timeout = filter(15, timeout);
		this.size = filter(this.world.screen.width / 100, size);
		this.animateTick = 0;
		this.outerRadius = 0;
		this.innerRadius = 0;
	}

	update(){
		if(this.isDead) return false;
		if(this.animateTick >= this.timeout) return this.setDead();

		this.alpha -= this.alpha / this.timeout;
		if(this.animateTick >= Math.floor(this.timeout / 2)){
			this.innerRadius += this.size / Math.ceil(this.timeout / 2);
		}

		this.outerRadius += this.size / this.timeout;

		this.animateTick++;
	}

	render(ctx){
		if(this.isDead) return;
		ctx.strokeStyle = this.color.alpha(this.alpha).string();
		ctx.lineWidth = this.width;

		ctx.beginPath();
		ctx.moveTo(this.x - this.outerRadius, this.y);
		ctx.lineTo(this.x - this.innerRadius, this.y);
		ctx.stroke();

		ctx.beginPath();
		ctx.moveTo(this.x + this.outerRadius, this.y);
		ctx.lineTo(this.x + this.innerRadius, this.y);
		ctx.stroke();
	}
}

class DefaultCloud extends Object{
	constructor(world, {layer, angle}){
		super(world);
		this.world = world;
		this.layer = layer;
		this.angle = filter(65, angle);
		this.tick = 0;
	}

	update(){
		if(this.isDead) return false;

		this.tick++;
		if(this.tick % 2 === 0){
			const layer = this.layer[Math.floor(Math.random() * this.layer.length)];
			const layerColor = Color(layer.color)
				.red(255 - Math.random() * 100)
				.green(255 - Math.random() * 100)
				.blue(255 - Math.random() * 10);

			const widthOffset = this.world.screen.height /
				Math.tan(this.angle / 180 * Math.PI);

			const rain = new Rain(this.world, {
				angle: this.angle + Math.random() * 8 - 4,
				x: Math.random() * (this.world.screen.width + widthOffset) - widthOffset,
				width: 0.5 + Math.random() * 2,
				height: 15 + Math.random() * 15 - 7.5,
				//acceleration: 5 + Math.random() * 2,
				acceleration: 1 + Math.random(),
				speed: 5 + Math.random() * 4,
				bottom: layer.bottom + Math.random() * 100 - 50,
				color: layerColor.alpha(layerColor.alpha() + Math.random() * .2 - .1),
				rippleSize: layer.rippleSize + Math.random() * 10 - 5,
				//rippleTimeout: 15 + Math.floor(Math.random() * 7) - 3,
				rippleTimeout: 25 + Math.floor(Math.random() * 7) - 3,
				//rippleAmount: 2 + Math.floor(Math.random() * 3) - 1,
				rippleAmount: 1,
				//rippleTick: 10 + Math.floor(Math.random() * 5) - 2
				rippleTick: 0,
				sound: layer.sound
			});
			this.world.addObjectToWorld(rain);
		}
	}
}

export default () => {
	const world = new World(Renderer.createMainRenderer(), {
		updateTick: 25,
		fps: 30,

		background(ctx, screen) {
			const background = ctx.createLinearGradient(0, 0, 0, screen.height);
			background.addColorStop(0, '#734b6d');
			background.addColorStop(1, '#42275a');

			return background;
		}
	});

	const cloud = new DefaultCloud(world, {
		layer: [
			{
				color: "rgba(255, 255, 255, 0.8)",
				rippleSize: 100,
				bottom: world.renderer.screen.height - 100,
				sound: 3136
			},

			{
				color: "rgba(255, 255, 255, 0.6)",
				rippleSize: 50,
				bottom: world.renderer.screen.height - 200,
				sound: 2637
			},

			{
				color: "rgba(255, 255, 255, 0.4)",
				rippleSize: 25,
				bottom: world.renderer.screen.height - 300,
				sound: 2093
			}
		]
	});
	world.addObjectToWorld(cloud);
	world.bindToRenderer();
	world.init();

	world.configs.soundEnabled = false;

	const iframe = document.createElement('iframe');
	iframe.width = 1;
	iframe.height = 1;
	iframe.src = "https://www.youtube-nocookie.com/embed/jX6kn9_U8qk?rel=0&loop=1&autoplay=1&disablekb=1&controls=0&showinfo=0";
	iframe.style.border = '0';

	document.body.append(iframe);
	
	window.world = world;
};
