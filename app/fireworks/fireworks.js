import Color from "color";
import Object from "../common/object";
import Renderer from "../common/renderer";
import World from "../common/world";

class Pallette {
	static random() {
		return {
			starter: '#ff9800',
			core: '#ffeb3b',
			phase1: '#ffc107',
			phase3: '#ffd54f',
			phase2: '#ffecb3'
		};
	}
}

class Firework extends Object{
	constructor(world){
		super(world);
		const screen = world.screen;
		this.world = world;
		this.screen = screen;

		this.x = Math.random() * screen.width;
		this.y = screen.height + 30;
		this.startX = this.x;
		this.startY = this.y;
		this.radius = Math.random() * 10 + 25;
		this.coreRadius = this.radius / 3;
		this.parallax = this.radius / 35 + 0.5;
		this.speed = 20 + 10 * this.parallax + Math.random() * 3;
		this.acceleration = Math.random() * this.parallax;
		this.pallette = Pallette.random();
		this.top = Math.max(screen.height / 6, screen.height - this.speed * 15);
		this.phases = Math.floor(Math.random() * 3) + 1;
	}

	update(){
		if(this.isDead) return false;
		this.speed += this.acceleration;
		this.y -= this.speed;

		if(this.y <= this.top) {
			this.createExplosion();
			return this.setDead();
		}
	}

	createExplosion(){
		const explosion = new Explosion(this.world, {
			x: this.x,
			y: this.y,
			pallette: this.pallette,
			phases: this.phases,
			radius: this.radius,
			coreRadius: this.coreRadius
		});

		this.world.addObjectToWorld(explosion);
	}

	render(ctx){
		const difference = (this.startY - this.y) / this.screen.height * 15;

		if(this.isDead) return;
		ctx.save();
		ctx.translate(this.x, this.y);
		ctx.fillStyle = this.pallette.starter;

		ctx.beginPath();
		ctx.moveTo(0, Math.min(100, this.startY - this.y));
		ctx.lineTo(-difference, 0);
		ctx.lineTo(difference, 0);
		ctx.closePath();
		ctx.fill();
		ctx.restore();
	}
}

class Explosion extends Object{
	constructor(world, {x, y, pallette, radius, phases, coreRadius}){
		super(world);
		this.x = x;
		this.y = y;
		this.pallette = pallette;
		this.radius = radius;
		this.coreRadius = radius;
		this.phases = phases;
		this.timeout = Math.floor(5 + Math.random() * 5);
		this.animateTick = 0;
		this.currentPhase = 0;
		this.currentRadius = 0;
		this.pauseTick = 0;
		this.radiusPerTick = radius / this.timeout;
		this.anglePerPhase = Math.PI / 6;
		this.baseAngle = Math.random() * Math.PI / 4;
	}

	update(){
		if(this.isDead) return false;

		if(this.pauseTick > 0) {
			this.pauseTick--;
			return;
		}

		if(this.animateTick >= this.timeout) {
			this.animateTick = 0;
			if(this.currentPhase >= this.phases) return this.setDead();

			this.currentPhase += Math.floor(this.currentRadius / this.radius);
			this.currentRadius = this.currentRadius % this.radius;
			this.pauseTick = 2;

			//if(this.currentPhase + 1 >= this.phases) this.pauseTick = 40;
		}

		this.currentRadius += this.radiusPerTick;

		this.animateTick++;
	}

	render(ctx){
		if(this.isDead) return;

		ctx.save();
		ctx.translate(this.x, this.y);
		ctx.fillStyle = this.pallette.core;
		ctx.beginPath();
		ctx.arc(0, 0, this.coreRadius, 0, Math.PI * 2);
		ctx.fill();

		for(let phase = 0; phase < this.currentPhase; phase++) {
			this.drawPhase(ctx, phase, this.radius);
		}

		this.drawPhase(ctx, this.currentPhase, this.currentRadius);
		ctx.restore();
	}

	drawPhase(ctx, phase, radius) {
		const baseRadius = phase * (this.radius + 5) + this.coreRadius * 1.5;
		const newRadius = baseRadius + radius;
		const count = baseRadius / 5;

		const baseAngle = this.baseAngle + this.anglePerPhase * phase;
		const anglePerStep = Math.PI * 2 / count;
		const margin = anglePerStep / 4;
		const fill = anglePerStep / 2;

		for(let angle = baseAngle; angle <= baseAngle + Math.PI * 2; angle += anglePerStep) {
			const startAngle = angle + margin;
			const endAngle = startAngle + fill;
			const mainAngle = startAngle + fill / 2;

			ctx.fillStyle = this.pallette[`phase${phase}`];
			ctx.beginPath();
			ctx.moveTo(Math.cos(mainAngle) * baseRadius, Math.sin(mainAngle) * baseRadius);
			ctx.lineTo(Math.cos(startAngle) * newRadius, Math.sin(startAngle) * newRadius);
			ctx.arc(0, 0, 10 + newRadius, startAngle, endAngle);
			ctx.closePath();
			ctx.fill();
		}
	}
}

class DefaultLauncher extends Object{
	constructor(world){
		super(world);
		this.world = world;
		this.tick = 0;
	}

	update(){
		if(this.isDead) return false;

		this.tick++;
		if(this.tick % 100 === 0){
			const firework = new Firework(this.world, {});
			this.world.addObjectToWorld(firework);
		}
	}
}

export default (canvas, background) => {
	const world = new World(canvas instanceof Renderer ? canvas : new Renderer(canvas), {
		updateTick: 25,
		fps: 30,

		background(ctx, screen) {
			if(background) return background;
			
			const background = ctx.createLinearGradient(0, 0, 0, screen.height);
			background.addColorStop(0, '#734b6d');
			background.addColorStop(1, '#42275a');

			return background;
		}
	});

	const launcher = new DefaultLauncher(world);
	world.addObjectToWorld(launcher);
	world.bindToRenderer();
	world.init();
};
