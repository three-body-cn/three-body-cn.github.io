function Aster(scene, config) {
    this.mScene = scene;
    this.mRadius = config.radius;
    this.mLoader = new THREE.TextureLoader();
    this.mMaterial = Physijs.createMaterial(
        new THREE.MeshLambertMaterial({map: this.mLoader.load(config.texPath)}),
        0.1, // low friction
        0.9  // high restitution
    );
    this.mMaterial.map.wrapS = THREE.RepeatWrapping;
	this.mMaterial.map.repeat.set(1.0, 1.0);
	this.mGeometry = new THREE.SphereGeometry(config.radius ,32, 32);
    this.mMesh = new Physijs.SphereMesh(
		this.mGeometry,
		this.mMaterial,
		mass = config.mass
    );
    this.mMesh.position.set(config.pos.x, config.pos.y, config.pos.z);
    this.mType = config.type;
    this.mMesh.name = name;
}

Aster.prototype.gravityForce = function(asters, debug = false) {
    var force = new THREE.Vector3(0, 0, 0)
    for (var i = 0; i < asters.length; i++) {
        aster = asters[i]
        if (aster == this) {continue}
        var distance = this.mMesh.position.distanceTo(aster.mMesh.position);
        // 万有引力公式
        var oneForce = aster.mMesh.position.clone().sub(this.mMesh.position).normalize()
                    .multiplyScalar(mUniverse.G)
                    .multiplyScalar(aster.mMesh.mass)
                    .multiplyScalar(this.mMesh.mass)
                    .divideScalar(Math.pow(distance,2));
        force.add(oneForce);
        
        if (debug) {
            alert("oneForce:" + logVector3(oneForce));
            alert("force:" + logVector3(force));
        }
    }
    if (debug) {
        alert("all force:" + logVector3(force));
    }
    this.mMesh.applyForce(force, new THREE.Vector3(0,0,0));
}