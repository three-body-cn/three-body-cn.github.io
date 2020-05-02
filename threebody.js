var mShowAssist = false;
var mStats;
var mRenderer;
var mCamera;
var mScene;
var mTrackballControls
var mAmbientLight;
// var mDirectionalLight;
var mSphere;
var mSwitchBoard;
// assist object
var mAxis;
var mMeshGrid;
var mMeshLineMaterial;

function onKeyPress(event) {
    var key;
    if (navigator.appName == "Netscape") {
        key = String.fromCharCode(event.charCode);
    } else {
        key = String.fromCharCode(event.keyCode);
    }
    switch (key) {
        case 'G':
        case 'g':
            mShowAssist = !mShowAssist;
            mMeshLineMaterial.visible = mShowAssist;
            mAxis.material.visible = mShowAssist;
            break;
        default:
            break;
    }

    requestAnimationFrame(render);
}

function initThree() {
    // fullscreen
    width = window.innerWidth;    // document.getElementById('canvas-frame').clientWidth;
    height = window.innerHeight;   // document.getElementById('canvas-frame').clientHeight;

    mRenderer = new THREE.WebGLRenderer({
        antialias : true
    });
    mRenderer.setSize(width, height);
    document.getElementById('canvas-frame').appendChild(mRenderer.domElement);
    mRenderer.setClearColor(0x000000, 1.0);

    mStats = new Stats();
    mStats.domElement.style.position = 'absolute';
    mStats.domElement.style.left = '5px';
    mStats.domElement.style.top = '5px';
    document.getElementById('canvas-frame').appendChild(mStats.domElement);

    // onSurfaceChanged
    window.addEventListener('resize', onWindowResize, false);
}

function onWindowResize() {
    mCamera.aspect = window.innerWidth / window.innerHeight;
    mCamera.updateProjectionMatrix();
    mRenderer.setSize(window.innerWidth, window.innerHeight);
}

function initCamera() {
    mCamera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100000);
    mCamera.position.x = 5;
    mCamera.position.y = 5;
    mCamera.position.z = 5;
    mCamera.up.x = 0;
    mCamera.up.y = 1;
    mCamera.up.z = 0;
    mCamera.lookAt(new THREE.Vector3(0.0, 0.0, 0.0));
}

function initScene() {
    mScene = new Physijs.Scene;
	mScene.setGravity(new THREE.Vector3(0, 0, 0));

    mAxis = new THREE.AxesHelper(20);
    mAxis.material.visible = mShowAssist;
    mScene.add(mAxis);

    // 创建控件并绑定在相机上
    mTrackballControls = new THREE.TrackballControls(mCamera);
    mTrackballControls.rotateSpeed = 1.0;
    mTrackballControls.zoomSpeed = 1.0;
    mTrackballControls.panSpeed = 1.0;
    mTrackballControls.noZoom=false;
    mTrackballControls.noPan=false;
    mTrackballControls.staticMoving = true;
    mTrackballControls.dynamicDampingFactor = 0.3;
}

function initLight() {
    mAmbientLight = new THREE.AmbientLight(0xffffff);
    mScene.add(mAmbientLight);
    // mDirectionalLight = new THREE.DirectionalLight();
    // mDirectionalLight.position.set(100, 100, 100);
    // mScene.add(mDirectionalLight);
}

function initBackground() {
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

	mScene.add(starField);
}

function getNumberInNormalDistribution(mean, std_dev){
    return mean + (randomNormalDistribution() * std_dev);
}

function randomNormalDistribution() {
    var u = 0.0, v = 0.0, w = 0.0, c = 0.0;
    do {
        u = Math.random() * 2 - 1.0;
        v = Math.random() * 2 - 1.0;
        w = u * u + v * v;
    } while(w == 0.0 || w >= 1.0)
    c = Math.sqrt((-2 * Math.log(w)) / w);
    return u * c;
}

function initObject() {
    var onProgress = function(xhr) {
        if (xhr.lengthComputable) {
            var percentComplete = xhr.loaded / xhr.total * 100;
            console.log(Math.round(percentComplete, 2) + '% loading');
        }
    };
    var onError = function(error) {
        // console.log('load error!' + error.getWebGLErrorMessage());
    };

    // assist mesh
    mMeshLineMaterial = new THREE.LineBasicMaterial({color: 0xffffff, opacity: 0.2});
    mMeshLineMaterial.visible = mShowAssist;
    mMeshGrid = new THREE.Geometry();
    mMeshGrid.vertices.push(new THREE.Vector3(-5, 0, 0));
    mMeshGrid.vertices.push(new THREE.Vector3( 5, 0, 0));
    for (var i = 0; i <= 10; i++) {
        var line = new THREE.Line(mMeshGrid, mMeshLineMaterial);
        line.position.z = (i * 1) - 5;
        mScene.add(line);

        var line = new THREE.Line(mMeshGrid, mMeshLineMaterial);
        line.position.x = (i * 1) - 5;
        line.rotation.y = 90 * Math.PI / 180;
        mScene.add(line);
    }

    // sphere and texture
    var geometry = new THREE.SphereGeometry(1, 32, 32);
    var texture = THREE.ImageUtils.loadTexture("model/Solar/Sol_Opaque_Mat_baseColor.png",null,function(t){});
    var material = new THREE.MeshLambertMaterial({map:texture});
    // var material = new THREE.MeshLambertMaterial({color: 0x00ff00});
    mSphere = new THREE.Mesh(geometry, material);
    mSphere.position.z = 0;
    mScene.add(mSphere);
}

function render() {
    var clock = new THREE.Clock();
    var delta = clock.getDelta();
    mTrackballControls.update(delta);

    mRenderer.clear();
    mRenderer.render(mScene, mCamera);

    mSphere.rotation.x += 0.01;
    mSphere.rotation.y += 0.01;
    if (null != mSwitchBoard) {
        mSwitchBoard.rotation.y += 0.01;
    }

    mStats.update();

    requestAnimationFrame(render);
}

function main() {
    initThree();
    initCamera();
    initScene();
    initBackground();
    initLight();
    initObject();
    render();
}