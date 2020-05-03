function Universe() {
	this.mObjects=[];
	this.mScene = GLScene();
	this.mUniverseTime = 0;
	this.mRunning = true;
	this.G = 66725.9;
}

Universe.prototype.addObject = function(object) {
	this.mObjects.push(object)
};

Universe.prototype.removeObject = function(object) {
	this.mObjects.remove(object)
};

Universe.prototype.start = function(callback, configData = undefined) {
	this.createAsters(configData['asters']);
	callback(this.mScene);
}

Universe.prototype.createAsters = function(asterDatas) {
	for (var i = 0; i < asterDatas.length; i++) {
		asterData = asterDatas[i];
		if (asterData['type'] == AsterType.STAR) {
			var star = createStar(this.mScene, asterData);
			star.mMesh.setLinearVelocity(new THREE.Vector3(asterData['initVelocity']['x'], asterData['initVelocity']['y'], asterData['initVelocity']['z']));
		} else if (asterData['type'] == AsterType.PLANET) {
			var earth = createEarth(this.mScene, asterData);
			earth.mMesh.setLinearVelocity(new THREE.Vector3(asterData['initVelocity']['x'], asterData['initVelocity']['y'], asterData['initVelocity']['z']));
		} else if (asterData['type'] == AsterType.SATELLITE) {
			var satellite = createSatellite(this.mScene, asterData);
			satellite.mMesh.setLinearVelocity(new THREE.Vector3(asterData['initVelocity']['x'], asterData['initVelocity']['y'], asterData['initVelocity']['z']));
		}
	}
}

const AsterType = {
	STAR: 0, 
	PLANET: 1, 
	SATELLITE: 2,
};