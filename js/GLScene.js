var GLScene = function() {
    var mScene = this;
    this.mRenderer = new THREE.WebGLRenderer({
        antialias : true
    });
    this.mRenderer.setSize(window.innerWidth, window.height);
    document.getElementById('canvas-frame').appendChild(this.mRenderer.domElement);
    this.mRenderer.setClearColor(0x000000, 1.0);

    this.mStats = new Stats();
    this.mStats.domElement.style.position = 'absolute';
    this.mStats.domElement.style.left = '5px';
    this.mStats.domElement.style.top = '5px';
    document.getElementById('canvas-frame').appendChild(this.mStats.domElement);

    this.mTextureLoader = new THREE.TextureLoader();

    this.mPhysicsScene = new Physijs.Scene;
    this.mPhysicsScene.setGravity(new THREE.Vector3(0, 0, 0));
    this.mPhysicsScene.addEventListener(
		'update',
		function() {
			mScene.onUpdate();
		}
    );
    
    this.createCamera();
    this.createLights();
    this.createBackground();
    this.mPhysicsScene.simulate();
    this.render(this.render, this.mRenderer, this.mCamera, this.mPhysicsScene);
}

GLScene.prototype.createCamera = function() {
    this.mCamera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100000);
    this.mCamera.position.x = 100;
    this.mCamera.position.y = 2100;
    this.mCamera.position.z = -200;
    this.mCamera.up.x = 0;
    this.mCamera.up.y = 1;
    this.mCamera.up.z = 0;
    this.mCamera.lookAt(new THREE.Vector3(0.0, 0.0, 0.0));
    this.mPhysicsScene.add(this.mCamera);
}

GLScene.prototype.createLights = function() {
    this.mAmbientLight = new THREE.AmbientLight(0xffffff);
    this.mPhysicsScene.add(this.mAmbientLight);
}

GLScene.prototype.createBackground = function() {
    // 创建一个圆形的材质，记得一定要加上texture.needsUpdate = true;
    let canvas = document.createElement("canvas");
    canvas.width = 100;
    canvas.height = 100;

    let context = canvas.getContext("2d");
    context.fillStyle = "#aaaaaa";

    // canvas创建圆 http://www.w3school.com.cn/tags/canvas_arc.asp
    context.arc(50, 50, 45, 0, 2 * Math.PI);
    context.fill();

    // 创建材质
    let texture = new THREE.Texture(canvas);
    texture.needsUpdate = true;
    var starsGeometry = new THREE.Geometry();

    for ( var i = 0; i < 500000; i ++ ) {
        var star = new THREE.Vector3();
        star.x = getNumberInNormalDistribution(-3100,1000);
        star.y = getNumberInNormalDistribution(0,5000);
        star.z = getNumberInNormalDistribution(0,10000);

        starsGeometry.vertices.push(star);
    }

    var starsMaterial = new THREE.PointsMaterial({color: 0xffffaa, size:20, map:texture});
    var starField = new THREE.Points(starsGeometry, starsMaterial);

    this.mPhysicsScene.add(starField);
}

GLScene.prototype.render = function(fun, renderer, camera, scene) {
    renderer.render(camera, scene);
    this.mStats.update();
    requestAnimationFrame(function() {
        fun(fun, renderer, camera, scene)
    });
}

GLScene.prototype.addObject = function(object) {
    this.mPhysicsScene.add(object.body)
    mUniverse.addObject(object)
}

GLScene.prototype.addElement = function(element) {
    this.mPhysicsScene.add(element)
}

GLScene.prototype.remove = function(element) {
    this.mPhysicsScene.remove(element)
}

GLScene.prototype.removeObject = function(object) {
    this.mPhysicsScene.remove(object.body)
    mUniverse.removeObject(object)
}

GLScene.prototype.onWindowResize = function() {
    this.mCamera.aspect = window.innerWidth / window.innerHeight;
    this.mCamera.updateProjectionMatrix();

    this.mRenderer.setSize(window.innerWidth, window.innerHeight);
}

GLScene.prototype.onUpdate = function(debug) {
    if (mUniverse.mRunning) {
        return ;
    }
    for (var i = 0; i < mUniverse.mObjects.length; i++) {
        if (mUniverse.mObjects[i].update != undefined) {
            mUniverse.mObjects[i].update();
        }
    }
    mUniverse.mUniverseTime++;
    if (debug) {
        console.log(getTimeWithNum(mUniverse.mUniverseTime));
        console.log(this.mCamera.position);
    }


    this.mPhysicsScene.simulate(undefined, 1);
}