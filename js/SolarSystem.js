var mShowAssist = false;
var mStats;
var mRenderer;
var mCamera;
var mSolarSystem;
var mTrackballControls;
var mAmbientLight;
var mMeshGrid;
var mAxis;
var mMeshLineMaterial;
// 添加太阳发光效果
var mSunLight;
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
            mMercury.track.visible = mShowAssist;
            mVenus.track.visible = mShowAssist;
            mEarth.track.visible = mShowAssist;
            mMars.track.visible = mShowAssist;
            mJupiter.track.visible = mShowAssist;
            mSaturn.track.visible = mShowAssist;
            mUranus.track.visible = mShowAssist;
            mNeptune.track.visible = mShowAssist;
            break;
        default:
            break;
    }
}

/**
 * 实现球体发光
 * @param color 颜色的r,g和b值,比如："123,123,123";
 * @returns {Element} 返回canvas对象
 */
var generateSprite = function (color) {
    var canvas = document.createElement('canvas');
    canvas.width = 16;
    canvas.height = 16;
    var context = canvas.getContext('2d');
    var gradient = context.createRadialGradient(canvas.width / 2, canvas.height / 2, 0, canvas.width / 2, 
        canvas.height / 2, canvas.width / 2);
    gradient.addColorStop(0, 'rgba(' + color + ',1)');
    gradient.addColorStop(0.2, 'rgba(' + color + ',1)');
    gradient.addColorStop(0.4, 'rgba(' + color + ',.6)');
    gradient.addColorStop(1, 'rgba(0,0,0,0)');
    context.fillStyle = gradient;
    context.fillRect(0, 0, canvas.width, canvas.height);
    return canvas;
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

/**
 * 返回行星轨道的组合体
 * @param scale 行星的大小
 * @param revolutionRadius 行星的公转半径
 * @param speed 行星运动速度
 * @param rotation THREE.Vector3 行星组合体的x,y,z三个方向的自转角度
 * @param imgUrl 行星的贴图
 * @param scene 场景
 * @returns {{satellite: THREE.Mesh, speed: *}} 行星组合对象;速度
*/
function initPlanet(scale, revolutionRadius, speed, rotation, imgUrl, scene) {
    var planet = new THREE.Object3D();
    var track = new THREE.Mesh(new THREE.RingGeometry(revolutionRadius, revolutionRadius + 0.05, 48, 1), new THREE.MeshBasicMaterial());
    track.rotation.x = -90 * Math.PI / 180;
    track.visible = mShowAssist;
    planet.add(track);
    
    var mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 32), new THREE.MeshLambertMaterial({
        map: THREE.ImageUtils.loadTexture(imgUrl, null, function(t){})})); 
    mesh.rotation.set(rotation.x, rotation.y, rotation.z);
    mesh.position.z = revolutionRadius;
    mesh.scale.x = mesh.scale.y = mesh.scale.z = scale;
    planet.add(mesh);

    scene.add(planet);
    
    return {starLite: mesh, speed: speed, track: track};
};

// // venus
// var venusGeo = new THREE.SphereGeometry(0.86 ,32, 32);
// var venusTex = THREE.ImageUtils.loadTexture("model/Venus/Venus_Terrain_Mat_baseColor.png",null,function(t){});
// var venusMat = new THREE.MeshLambertMaterial({map:venusTex});
// mVenus = new THREE.Mesh(venusGeo, venusMat);
// mVenus.position.z = 16;
// mSolarSystem.add(mVenus);

function initBackground() {
    // 创建一个圆形的材质，记得一定要加上texture.needsUpdate = true;
    let canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 64;

    let context = canvas.getContext("2d");
    context.fillStyle = "#aaaaaa";

    // canvas创建圆 http://www.w3school.com.cn/tags/canvas_arc.asp
    context.arc(32, 32, 25, 0, 2 * Math.PI);
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
    mStats.domElement.style.visible = mShowAssist;
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

function initScene() {
    mSolarSystem = new THREE.Scene();

    mAxis = new THREE.AxesHelper(50);
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

    // 添加太阳发光效果
    mSunLight = new THREE.Sprite(new THREE.SpriteMaterial({map: new THREE.CanvasTexture(generateSprite("255, 255, 255")),
        blending: THREE.AdditiveBlending}));
    mSunLight.scale.x = mSunLight.scale.y = mSunLight.scale.z = 30;
    mSolarSystem.add(mSunLight);
    // sun
    var sunGeo = new THREE.SphereGeometry(7 ,32, 32);
    var sunTex = THREE.ImageUtils.loadTexture("model/Solar/Sol_Opaque_Mat_baseColor.png",null,function(t){});
    var sunMat = new THREE.MeshLambertMaterial({map:sunTex});
    mSun = new THREE.Mesh(sunGeo, sunMat);
    mSolarSystem.add(mSun);
    // mercury
    mMercury = initPlanet(0.56, 13, 100, new THREE.Vector3(0.1, 0.1, 0), "model/Mercury/Mercury_Mat_baseColor.png", mSolarSystem);
    // venus
    mVenus = initPlanet(0.86, 16, 100, new THREE.Vector3(0.1, 0.1, 0), "model/Venus/Venus_Terrain_Mat_baseColor.png", mSolarSystem);
    // earth
    mEarth = initPlanet(1, 20, 100, new THREE.Vector3(0.1, 0.1, 0), "model/Earth/Earth_Mat_baseColor.png", mSolarSystem);
    // mars
    mMars = initPlanet(0.5, 25, 100, new THREE.Vector3(0.1, 0.1, 0), "model/Mars/Mars_mat_baseColor.png", mSolarSystem);
    // jupiter
    mJupiter = initPlanet(4, 35, 100, new THREE.Vector3(0.1, 0.1, 0), "model/Jupiter/Jupiter_Mat_baseColor.png", mSolarSystem);
    // saturn
    mSaturn = initPlanet(3, 50, 100, new THREE.Vector3(0.1, 0.1, 0), "model/Saturn/SaturnPlanet_Opaque_Mat_baseColor.png", mSolarSystem);
    // uranus
    mUranus = initPlanet(2, 60, 100, new THREE.Vector3(0.1, 0.1, 0), "model/Uranus/UranusGlobe_Mat_baseColor.png", mSolarSystem);
    // neptune
    mNeptune = initPlanet(1.8, 70, 100, new THREE.Vector3(0.1, 0.1, 0), "model/Neptune/NeptuneGlobe_Mat_baseColor.png", mSolarSystem);
}

function render() {
    var clock = new THREE.Clock();
    var delta = clock.getDelta();
    mTrackballControls.update(delta);

    mRenderer.clear();
    mRenderer.render(mSolarSystem, mCamera);

    // // 自转
    // mEarth.rotation.x += 0.001;
    // mEarth.rotation.y += 0.01;

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