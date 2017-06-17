class Object{
	constructor(world){
		this.world = world;
		this.x = 0;
		this.y = 0;
		this.angle = 90;
		this.isDead = false;
	}

	divideVector(scala){
		return {
			x: Math.cos(this.angle) * scala,
			y: Math.sin(this.angle) * scala
		};
	}

	move(amount){
		const {x, y} = this.divideVector(amount);
		this.x += x;
		this.y += y;
	}

	setDead(){
		this.isDead = true;
		return false;
	}

	render(){}

	update(){}
}

export default Object;
