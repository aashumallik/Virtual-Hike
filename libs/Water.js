import "https://unpkg.com/three@0.91.0/examples/js/objects/Water.js";

export class Water {
	isLoading = true;

	constructor(scene, light, waterLevel) {
		const that = this;

		this.light = light;
		var waterGeometry = new THREE.PlaneBufferGeometry( 1024, 1024 );

		this.water = new THREE.Water(
			waterGeometry,
			{
				textureWidth: 512,
				textureHeight: 512,
				waterNormals: new THREE.TextureLoader().load( 'img/waternormals.jpg', function ( texture ) {
					texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
					that.isLoading = false;
				}),
				alpha: 1.0,
				sunDirection: this.light.position.clone().normalize(),
				sunColor: 0xffffff,
				waterColor: 0x001e0f,
				distortionScale:  3.7,
				fog: scene.fog !== undefined
			}
		);

		this.water.position.y = waterLevel;
		this.water.rotation.x = - Math.PI / 2;

		scene.add(this.water);
	}

	update(delta) {
		this.water.material.uniforms.sunDirection.value.copy( this.light.position ).normalize();
		this.water.material.uniforms.time.value += delta;

		this.water.rotation.z = this.rotationZ;
	}
}