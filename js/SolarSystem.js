var mShowAssist = false;
var mStats;
var mRenderer;
var mCamera;
var mSolarSystem;
var mTrackballControls;
var mAmbientLight;
var mSwitchBoard;
var mMeshGrid;
var mAxis;
var mMeshLineMaterial;
// stars
var mSun;
var mMercury;
var mVenus;
var mEarth;
var mMoon;
var mMars;
var mJupiter;
var mSaturn;
var mUranus;
var mNeptune;

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
}

function initThree() {
    width = document.getElementById('canvas-frame').clientWidth;
    height = document.getElementById('canvas-frame').clientHeight;
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
    mCamera = new THREE.PerspectiveCamera(45, width / height, 1, 100000);
    mCamera.position.x = 70;
    mCamera.position.y = 70;
    mCamera.position.z = 70;
    mCamera.up.x = 0;
    mCamera.up.y = 1;
    mCamera.up.z = 0;
    mCamera.lookAt(new THREE.Vector3(0.0, 0.0, 0.0));
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

	mSolarSystem.add(starField);
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

function initScene() {
    mSolarSystem = new THREE.Scene();

    mAxis = new THREE.AxisHelper(50);
    mAxis.material.visible = mShowAssist;
    mSolarSystem.add(mAxis);

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
    mAmbientLight = new THREE.AmbientLight(0xcccccc);
    mSolarSystem.add(mAmbientLight);
}

function initObjects() {
    var onProgress = function(xhr) {
        if (xhr.lengthComputable) {
            var percentComplete = xhr.loaded / xhr.total * 100;
            console.log(Math.round(percentComplete, 2) + '% loading');
        }
    };
    var onError = function(error) {
        console.log('load error!' + error.getWebGLErrorMessage());
    };

    mMeshLineMaterial = new THREE.LineBasicMaterial({color: 0xffffff, opacity: 0.2});
    mMeshLineMaterial.visible = mShowAssist;
    mMeshGrid = new THREE.Geometry();
    mMeshGrid.vertices.push(new THREE.Vector3(-50, 0, 0));
    mMeshGrid.vertices.push(new THREE.Vector3( 50, 0, 0));
    for (var i = 0; i <= 10; i ++) {
        var line = new THREE.Line(mMeshGrid, mMeshLineMaterial);
        line.position.z = (i * 10) - 50;
        mSolarSystem.add(line);

        var line = new THREE.Line(mMeshGrid, mMeshLineMaterial);
        line.position.x = (i * 10) - 50;
        line.rotation.y = 90 * Math.PI / 180;
        mSolarSystem.add(line);
    }

    // sun
    var sunGeo = new THREE.SphereGeometry(7 ,32, 32);
    var sunTex = THREE.ImageUtils.loadTexture("model/Solar/Sol_Opaque_Mat_baseColor.png",null,function(t){});
    var sunMat = new THREE.MeshLambertMaterial({map:sunTex});
    mSun = new THREE.Mesh(sunGeo, sunMat);
    mSolarSystem.add(mSun);
    // mercury
    var mercuryGeo = new THREE.SphereGeometry(0.256 ,32, 32);
    var mercuryTex = THREE.ImageUtils.loadTexture("model/Mercury/Mercury_Mat_baseColor.png",null,function(t){});
    var mercuryMat = new THREE.MeshLambertMaterial({map:mercuryTex});
    mMercury = new THREE.Mesh(mercuryGeo, mercuryMat);
    mMercury.position.z = 13;
    mSolarSystem.add(mMercury);
    // venus
    var venusGeo = new THREE.SphereGeometry(0.86 ,32, 32);
    var venusTex = THREE.ImageUtils.loadTexture("model/Venus/Venus_Terrain_Mat_baseColor.png",null,function(t){});
    var venusMat = new THREE.MeshLambertMaterial({map:venusTex});
    mVenus = new THREE.Mesh(venusGeo, venusMat);
    mVenus.position.z = 16;
    mSolarSystem.add(mVenus);
    // earth
    var earthGeo = new THREE.SphereGeometry(1 ,32, 32);
    var earthTex = THREE.ImageUtils.loadTexture("model/Earth/Earth_Mat_baseColor.png",null,function(t){});
    var earthMat = new THREE.MeshLambertMaterial({map:earthTex});
    mEarth = new THREE.Mesh(earthGeo, earthMat);
    mEarth.position.z = 20;
    mSolarSystem.add(mEarth);
    // mars
    var marsGeo = new THREE.SphereGeometry(0.5 ,32, 32);
    var marsTex = THREE.ImageUtils.loadTexture("model/Mars/Mars_mat_baseColor.png",null,function(t){});
    var marsMat = new THREE.MeshLambertMaterial({map:marsTex});
    mMars = new THREE.Mesh(marsGeo, marsMat);
    mMars.position.z = 25;
    mSolarSystem.add(mMars);
    // jupiter
    var jupiterGeo = new THREE.SphereGeometry(4 ,32, 32);
    var jupiterTex = THREE.ImageUtils.loadTexture("model/Jupiter/Jupiter_Mat_baseColor.png",null,function(t){});
    var jupiterMat = new THREE.MeshLambertMaterial({map:jupiterTex});
    mJupiter = new THREE.Mesh(jupiterGeo, jupiterMat);
    mJupiter.position.z = 35;
    mSolarSystem.add(mJupiter);
    // saturn
    var saturnGeo = new THREE.SphereGeometry(3 ,32, 32);
    var saturnTex = THREE.ImageUtils.loadTexture("model/Saturn/SaturnPlanet_Opaque_Mat_baseColor.png",null,function(t){});
    var saturnMat = new THREE.MeshLambertMaterial({map:saturnTex});
    mSaturn = new THREE.Mesh(saturnGeo, saturnMat);
    mSaturn.position.z = 50;
    mSolarSystem.add(mSaturn);
    // uranus
    var uranusGeo = new THREE.SphereGeometry(2 ,32, 32);
    var uranusTex = THREE.ImageUtils.loadTexture("model/Uranus/UranusGlobe_Mat_baseColor.png",null,function(t){});
    var uranusMat = new THREE.MeshLambertMaterial({map:uranusTex});
    mUranus = new THREE.Mesh(uranusGeo, uranusMat);
    mUranus.position.z = 60;
    mSolarSystem.add(mUranus);
    // neptune
    var neptuneGeo = new THREE.SphereGeometry(1.8 ,32, 32);
    var neptuneTex = THREE.ImageUtils.loadTexture("model/Neptune/NeptuneGlobe_Mat_baseColor.png",null,function(t){});
    var neptuneMat = new THREE.MeshLambertMaterial({map:neptuneTex});
    mNeptune = new THREE.Mesh(neptuneGeo, neptuneMat);
    mNeptune.position.z = 70;
    mSolarSystem.add(mNeptune);
}

function render() {
    var clock = new THREE.Clock();
    var delta = clock.getDelta();
    mTrackballControls.update(delta);

    mRenderer.clear();
    mRenderer.render(mSolarSystem, mCamera);

    mEarth.rotation.x += 0.01;
    mEarth.rotation.y += 0.01;
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
    initObjects();
    render();
}