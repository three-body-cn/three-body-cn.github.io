function Aster(scene, config) {
    this.mScene = scene;
    this.mRadius = config.radius;
    this.mLoader = new THREE.TextureLoader();
    this.mType = config.type;
    if (this.mType == AsterType.STAR) {
        this.mMeshMaterial = new THREE.MeshLambertMaterial({map: this.mLoader.load(config.texPath), emissive: 0x888833});
    } else {
        this.mMeshMaterial = new THREE.MeshLambertMaterial({map: this.mLoader.load(config.texPath)});
    }
    this.mMaterial = Physijs.createMaterial(this.mMeshMaterial,
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
    this.mMesh.radius = config.radius;
    this.mMesh.name = name;
    this.debugLogCnt = 10
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
        
        if (debug && this.debugLogCnt > 0) {
            console.log("oneForce:" + this.logVector3(oneForce));
            console.log("force:" + this.logVector3(force));
        }
    }
    if (debug && this.debugLogCnt > 0) {
        console.log("all force:" + this.logVector3(force));
        console.log("position:" + this.logVector3(this.mMesh.position));
    }
    this.mMesh.applyForce(force, new THREE.Vector3(0,0,0));
    this.debugLogCnt--;
}

Aster.prototype.logVector3 = function(vector) {
	return "vec[x] = " + vector.x + ", vec[y] = " + vector.y + ", vec[z] = " + vector.z;
}

Aster.prototype.update = function() {
    this.gravityForce(mUniverse.mObjects)
}