var mShowAssist = false;
var mStats;
var mRenderer;
var mCamera;
var mSolarSystem;
var mTrackballControls;
var mAmbientLight;
var mPointLight;    // SunLight
var mMeshGrid;
var mAxis;
var mMeshLineMaterial;
// 添加太阳发光效果
var mSunLight;
// stars
var mSun;
var mSunGroup;
var mSunClouds = [];
var mFlareGroup;
var mPlanets = [];
var mMercury;
var mVenus;
var mEarth;
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
    if (mShowAssist) {
        document.getElementById('canvas-frame').appendChild(mStats.domElement);
    } else {
        document.getElementById('canvas-frame').removeChild(mStats.domElement);
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
 * @param speed 行星公转速度
 * @param pivot 公转参照物
 * @param rotation THREE.Vector3 行星组合体的x,y,z三个方向的自转角速度
 * @param imgUrl 行星的贴图
 * @param scene 场景
 * @returns {{satellite: THREE.Mesh, speed: *}} 行星组合对象;速度
*/
function createPlanet(scale, revolutionRadius, speed, pivot, rotation, imgUrl, scene, satellite = undefined, 
    normalImgUrl = undefined, metalImgUrl = undefined) {
    var planetAndSatellite = new THREE.Object3D();
    var planetAndTrack = new THREE.Object3D();
    var track = new THREE.Mesh(new THREE.RingGeometry(revolutionRadius, revolutionRadius + 0.05, 48, 1), new THREE.MeshBasicMaterial());
    track.rotation.x = -90 * Math.PI / 180;
    track.visible = mShowAssist;
    planetAndTrack.add(track);
    
    var material = new THREE.MeshPhysicalMaterial({
        map: THREE.ImageUtils.loadTexture(imgUrl, null, function(t){}), 
        metalness: 0.1, 
        roughness: 0.8
    });
    if (undefined != normalImgUrl) 
        material.normalMap = new THREE.ImageUtils.loadTexture(normalImgUrl);
    if (undefined != metalImgUrl) { 
        material.metalnessMap = new THREE.ImageUtils.loadTexture(metalImgUrl);
    }
    var mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 32), material); 
    planetAndSatellite.add(mesh);
    if (undefined != satellite) 
        planetAndSatellite.add(satellite);
    planetAndSatellite.rotation.set(rotation.x, rotation.y, rotation.z);
    planetAndSatellite.position.z = revolutionRadius;
    planetAndSatellite.scale.x = planetAndSatellite.scale.y = planetAndSatellite.scale.z = scale;
    planetAndTrack.add(planetAndSatellite);

    var solarPlanetSys = new THREE.Group();
    solarPlanetSys.add(pivot);
    solarPlanetSys.add(planetAndTrack);
    solarPlanetSys.rotation.y = Math.random();

    scene.add(solarPlanetSys);
    
    return {group: solarPlanetSys, planet: planetAndSatellite, speed: speed, rotation: rotation, track: track};
};

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

	var starsMaterial = new THREE.PointsMaterial({color: 0xffffaa, size:10, map:texture, blending: THREE.AdditiveBlending, transparent: true});
	var starField = new THREE.Points(starsGeometry, starsMaterial);

	mSolarSystem.add(starField);
}

function initThree() {
    mRenderer = new THREE.WebGLRenderer({
        antialias : true
    });
    mRenderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById('canvas-frame').appendChild(mRenderer.domElement);
    mRenderer.setClearColor(0x000000, 1.0);

    mStats = new Stats();
    mStats.domElement.style.position = 'absolute';
    mStats.domElement.style.left = '5px';
    mStats.domElement.style.top = '5px';

    // onSurfaceChanged
    window.addEventListener('resize', onWindowResize, false);
}

function onWindowResize() {
    mCamera.aspect = window.innerWidth / window.innerHeight;
    mCamera.updateProjectionMatrix();
    mRenderer.setSize(window.innerWidth, window.innerHeight);
}

function initCamera() {
    mCamera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 100000);
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
    mTrackballControls.minDistance = 10;
    mTrackballControls.maxDistance = 1000;
    mTrackballControls.noPan=false;
    mTrackballControls.staticMoving = true;
    mTrackballControls.dynamicDampingFactor = 0.3;
}

function initLight() {
    mAmbientLight = new THREE.AmbientLight(0x777777);
    mSolarSystem.add(mAmbientLight);
    mPointLight = new THREE.PointLight(0xffffff, 1, 1000, 0.2);
    mPointLight.castShadow = true;
    mSolarSystem.add(mPointLight);
}

// Returns an Object3D containing a solar flare plane (base + emissive) oriented radially outward.
// The plane bottom edge sits at sunRadius; it extends outward by fh along the radial direction.
function createSunFlare(baseTex, emissTex, sunRadius, theta, phi, fw, fh) {
    var rdx = Math.cos(phi) * Math.sin(theta);
    var rdy = Math.sin(phi);
    var rdz = Math.cos(phi) * Math.cos(theta);
    var radialDir = new THREE.Vector3(rdx, rdy, rdz).normalize();
    var quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), radialDir);
    var pos = radialDir.clone().multiplyScalar(sunRadius + fh * 0.5);
    var geo = new THREE.PlaneGeometry(fw, fh);

    var makeFlare = function(tex, opacity) {
        var m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({
            map: tex, transparent: true, side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending, depthWrite: false, opacity: opacity
        }));
        m.position.copy(pos);
        m.quaternion.copy(quat);
        return m;
    };

    var group = new THREE.Object3D();
    group.add(makeFlare(baseTex, 0.9));
    group.add(makeFlare(emissTex, 0.7));
    return group;
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

    // outer glow sprite — orange tint to match solar color
    mSunLight = new THREE.Sprite(new THREE.SpriteMaterial({
        map: new THREE.CanvasTexture(generateSprite("255, 140, 30")),
        blending: THREE.AdditiveBlending
    }));
    mSunLight.scale.set(50, 50, 50);
    mSolarSystem.add(mSunLight);

    // ── Sun — three-layer reconstruction from Sol.gltf textures ──────────
    var texLoader = new THREE.TextureLoader();
    var SUN_R = 7;
    mSunGroup = new THREE.Object3D();

    // 1. Opaque body (Sol_Opaque_Mat, KHR_materials_unlit → MeshBasicMaterial)
    //    Base-color sphere + emissive overlay with additive blending
    mSun = new THREE.Object3D();
    mSun.add(new THREE.Mesh(
        new THREE.SphereGeometry(SUN_R, 64, 64),
        new THREE.MeshBasicMaterial({
            map: texLoader.load("model/Solar/Sol_Opaque_Mat_baseColor.png")
        })
    ));
    mSun.add(new THREE.Mesh(
        new THREE.SphereGeometry(SUN_R + 0.1, 64, 64),
        new THREE.MeshBasicMaterial({
            map: texLoader.load("model/Solar/Sol_Opaque_Mat_emissive.png"),
            transparent: true, blending: THREE.AdditiveBlending, depthWrite: false
        })
    ));
    mSunGroup.add(mSun);

    // 2. Transparent corona / cloud layers (Sol_Transparent_Mat, alphaMode BLEND)
    //    Four concentric spheres rotating on different axes at different speeds
    var cloudBaseTex  = texLoader.load("model/Solar/Sol_Transparent_Mat_baseColor.png");
    var cloudEmissTex = texLoader.load("model/Solar/Sol_Transparent_Mat_emissive.png");
    mSunClouds = [];
    var cloudDefs = [
        { r: SUN_R * 1.03, speed:  0.0009, axis: new THREE.Vector3(0, 1, 0) },
        { r: SUN_R * 1.07, speed: -0.0006, axis: new THREE.Vector3(1, 0.2, 0.3).normalize() },
        { r: SUN_R * 1.12, speed:  0.0005, axis: new THREE.Vector3(0.3, 0, 1).normalize() },
        { r: SUN_R * 1.18, speed: -0.0003, axis: new THREE.Vector3(0.1, 1, 0.4).normalize() }
    ];
    for (var ci = 0; ci < cloudDefs.length; ci++) {
        var cd = cloudDefs[ci];
        var layer = new THREE.Object3D();
        layer.userData.axis = cd.axis;
        layer.userData.speed = cd.speed;
        layer.add(new THREE.Mesh(
            new THREE.SphereGeometry(cd.r, 48, 48),
            new THREE.MeshBasicMaterial({
                map: cloudBaseTex, transparent: true,
                blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.45
            })
        ));
        layer.add(new THREE.Mesh(
            new THREE.SphereGeometry(cd.r + 0.1, 48, 48),
            new THREE.MeshBasicMaterial({
                map: cloudEmissTex, transparent: true,
                blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.30
            })
        ));
        mSunGroup.add(layer);
        mSunClouds.push(layer);
    }

    // 3. Solar flares (SolarFlare_Transparent_Mat, alphaMode BLEND)
    //    PlaneGeometry panels oriented radially: arcs, bursts and loops
    var flareTex  = texLoader.load("model/Solar/SolarFlare_Transparent_Mat_baseColor.png");
    var flareEmis = texLoader.load("model/Solar/SolarFlare_Transparent_Mat_emissive.png");
    mFlareGroup = new THREE.Object3D();
    var fDefs = [
        // Arcs (narrow, tall) — [theta, phi, width, height]
        [0.00,  0.10, SUN_R*0.28, SUN_R*0.85],
        [0.63,  0.40, SUN_R*0.22, SUN_R*0.70],
        [1.26, -0.20, SUN_R*0.32, SUN_R*0.90],
        [1.88,  0.55, SUN_R*0.18, SUN_R*0.65],
        [2.51, -0.35, SUN_R*0.26, SUN_R*0.80],
        [3.14,  0.15, SUN_R*0.24, SUN_R*0.75],
        [3.77, -0.45, SUN_R*0.30, SUN_R*0.88],
        [4.40,  0.30, SUN_R*0.20, SUN_R*0.72],
        [5.03, -0.10, SUN_R*0.28, SUN_R*0.82],
        [5.65,  0.50, SUN_R*0.22, SUN_R*0.68],
        // Bursts (wider, shorter)
        [0.30, -0.65, SUN_R*0.50, SUN_R*0.60],
        [1.10,  0.70, SUN_R*0.55, SUN_R*0.65],
        [2.00, -0.55, SUN_R*0.45, SUN_R*0.58],
        [2.80,  0.75, SUN_R*0.60, SUN_R*0.62],
        [3.60, -0.60, SUN_R*0.50, SUN_R*0.60],
        [4.50,  0.65, SUN_R*0.55, SUN_R*0.63],
        [5.20, -0.70, SUN_R*0.45, SUN_R*0.58],
        // Loops (medium width and height)
        [0.60,  0.82, SUN_R*0.40, SUN_R*0.72],
        [1.50, -0.78, SUN_R*0.38, SUN_R*0.70],
        [2.40,  0.80, SUN_R*0.42, SUN_R*0.75],
        [3.30, -0.72, SUN_R*0.36, SUN_R*0.68],
        [4.20,  0.76, SUN_R*0.40, SUN_R*0.73]
    ];
    for (var fi = 0; fi < fDefs.length; fi++) {
        mFlareGroup.add(createSunFlare(flareTex, flareEmis, SUN_R,
            fDefs[fi][0], fDefs[fi][1], fDefs[fi][2], fDefs[fi][3]));
    }
    mSunGroup.add(mFlareGroup);
    mSolarSystem.add(mSunGroup);
    // revolution pivot
    var revolutionPivot = new THREE.Object3D();
    // mercury
    mMercury = createPlanet(0.56, 13, 0.04, revolutionPivot, new THREE.Vector3(0.0, 0.001, 0), "model/Mercury/Mercury_Mat_baseColor.png", mSolarSystem);
    mPlanets.push(mMercury);
    // venus
    mVenus = createPlanet(0.86, 16, 0.015, revolutionPivot, new THREE.Vector3(0.0, 0.001, 0), "model/Venus/Venus_Terrain_Mat_baseColor.png", mSolarSystem);
    mVenus.planet.rotation.set(Math.PI, 0, 0);
    mPlanets.push(mVenus);
    // earth and moon
    var luna = new THREE.Mesh(new THREE.SphereGeometry(0.25, 32, 32), new THREE.MeshPhysicalMaterial({
        map: THREE.ImageUtils.loadTexture("model/Luna/Luna_Mat_baseColor.png", null, function(t){}),
        normalMap: THREE.ImageUtils.loadTexture("model/Luna/Luna_Mat_normal.png", null, function(t){}),
        roughnessMap: THREE.ImageUtils.loadTexture("model/Luna/Luna_Mat_occlusionRoughnessMetallic.png", null, function(t){}),
        metalnessMap: THREE.ImageUtils.loadTexture("model/Luna/Luna_Mat_occlusionRoughnessMetallic.png", null, function(t){})
    })); 
    luna.position.z = 2;
    mEarth = createPlanet(1, 20, 0.01, revolutionPivot, new THREE.Vector3(0.0, 0.1, 0), "model/Earth/Earth_Mat_baseColor.png", 
        mSolarSystem, luna, "model/Earth/Earth_Mat_normal.png", "model/Earth/Earth_Mat_occlusionRoughnessMetallic.png");
    mEarth.planet.rotation.set(Math.PI / 8, 0, 0);    // 转轴倾角，赤道与黄道面夹角
    mPlanets.push(mEarth);
    // mars
    mMars = createPlanet(0.5, 25, 0.005, revolutionPivot, new THREE.Vector3(0.0, 0.1, 0), "model/Mars/Mars_mat_baseColor.png", mSolarSystem);
    mMars.planet.rotation.set(Math.PI / 8, 0, 0);
    mPlanets.push(mMars);
    // jupiter
    var jupiterStarRingMaterial = new THREE.MeshLambertMaterial({
        map: THREE.ImageUtils.loadTexture("model/Saturn/SaturnRings_Mat_baseColor.png", null, function(t){})
    });
    jupiterStarRingMaterial.side = THREE.DoubleSide;
    var jupiterStarRing = new THREE.Mesh(new THREE.RingGeometry(1.2, 1.4, 32, 1), jupiterStarRingMaterial);
    jupiterStarRing.rotation.x = -90 * Math.PI / 180;
    mJupiter = createPlanet(4, 35, 0.003, revolutionPivot, new THREE.Vector3(0.0, 0.15, 0), "model/Jupiter/Jupiter_Mat_baseColor.png", mSolarSystem, jupiterStarRing);
    mJupiter.planet.rotation.set(Math.PI / 32, 0, 0);
    mPlanets.push(mJupiter);
    // saturn
    var saturnStarRingMaterial = new THREE.MeshLambertMaterial({
        map: THREE.ImageUtils.loadTexture("model/Saturn/SaturnRings_Mat_baseColor.png", null, function(t){})
    });
    saturnStarRingMaterial.side = THREE.DoubleSide;
    var saturnStarRing = new THREE.Mesh(new THREE.RingGeometry(1.1, 1.5, 32, 1), saturnStarRingMaterial);
    saturnStarRing.rotation.x = -90 * Math.PI / 180;
    mSaturn = createPlanet(3, 50, 0.001, revolutionPivot, new THREE.Vector3(0.0, 0.14, 0), "model/Saturn/SaturnPlanet_Opaque_Mat_baseColor.png", mSolarSystem, saturnStarRing);
    mSaturn.planet.rotation.set(Math.PI / 8, 0, 0);
    mPlanets.push(mSaturn);
    // uranus
    mUranus = createPlanet(2, 60, 0.0006, revolutionPivot, new THREE.Vector3(0.0, 0.11, 0), "model/Uranus/UranusGlobe_Mat_baseColor.png", mSolarSystem);
    mUranus.planet.rotation.set(Math.PI / 2, 0, 0);
    mPlanets.push(mUranus);
    // neptune
    mNeptune = createPlanet(1.8, 70, 0.0003, revolutionPivot, new THREE.Vector3(0.0, 0.12, 0), "model/Neptune/NeptuneGlobe_Mat_baseColor.png", mSolarSystem);
    mNeptune.planet.rotation.set(Math.PI / 8, 0, 0);
    mPlanets.push(mNeptune);
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
    updateScene();

    mStats.update();

    requestAnimationFrame(render);
}

function updateScene() {
    for (var i = 0; i < mPlanets.length; i++) {
        mPlanets[i].group.rotation.y -= mPlanets[i].speed;  // 公转
        // 自转
        mPlanets[i].planet.rotation.x += mPlanets[i].rotation.x;
        mPlanets[i].planet.rotation.y -= mPlanets[i].rotation.y;
    }
    mSun.rotation.y -= 0.004;   // 太阳自转速度
    for (var ci = 0; ci < mSunClouds.length; ci++) {
        mSunClouds[ci].rotateOnAxis(mSunClouds[ci].userData.axis, mSunClouds[ci].userData.speed);
    }
    mFlareGroup.rotation.y += 0.0015;
    mFlareGroup.rotation.x += 0.0003;
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