var mStats;
var mRenderer;
var mCamera;
var mSolarSystem;
var mTrackballControls;
var mAmbientLight;
var mSwitchBoard;
var mMeshGrid;
// stars
var mEarth;

function initThree() {
    width = document.getElementById('canvas-frame').clientWidth;
    height = document.getElementById('canvas-frame').clientHeight;
    mRenderer = new THREE.WebGLRenderer({
        antialias : true
    });
    mRenderer.setSize(width, height);
    document.getElementById('canvas-frame').appendChild(mRenderer.domElement);
    mRenderer.setClearColor(0xFFFFFF, 1.0);

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
    mCamera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    mCamera.position.x = 5;
    mCamera.position.y = 5;
    mCamera.position.z = 5;
    mCamera.up.x = 0;
    mCamera.up.y = 1;
    mCamera.up.z = 0;
    mCamera.lookAt(new THREE.Vector3(0.0, 0.0, 0.0));
}

function initScene() {
    mSolarSystem = new THREE.Scene();

    var axis = new THREE.AxisHelper(20);
    mSolarSystem.add(axis);

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
    mAmbientLight = new THREE.AmbientLight(0x555555);
    mSolarSystem.add(mAmbientLight);
    mDirectionalLight = new THREE.DirectionalLight();
    mDirectionalLight.position.set(100, 100, 100);
    mSolarSystem.add(mDirectionalLight);
}

function initObject() {
    var onProgress = function(xhr) {
        if (xhr.lengthComputable) {
            var percentComplete = xhr.loaded / xhr.total * 100;
            console.log(Math.round(percentComplete, 2) + '% loading');
        }
    };
    var onError = function(error) {
        console.log('load error!' + error.getWebGLErrorMessage());
    };

    mMeshGrid = new THREE.Geometry();
    mMeshGrid.vertices.push(new THREE.Vector3(-5, 0, 0));
    mMeshGrid.vertices.push(new THREE.Vector3( 5, 0, 0));
    for (var i = 0; i <= 10; i ++) {
        var line = new THREE.Line(mMeshGrid, new THREE.LineBasicMaterial({color: 0x000000, opacity: 0.2}));
        line.position.z = (i * 1) - 5;
        mSolarSystem.add(line);

        var line = new THREE.Line(mMeshGrid, new THREE.LineBasicMaterial({color: 0x000000, opacity: 0.2}));
        line.position.x = (i * 1) - 5;
        line.rotation.y = 90 * Math.PI / 180;
        mSolarSystem.add(line);
    }

    // cube and texture
    var geometry = new THREE.SphereGeometry(1 ,32, 32);
    var earthTex = THREE.ImageUtils.loadTexture("model/Earth/Earth_Mat_baseColor.png",null,function(t){});
    var cubeMat = new THREE.MeshLambertMaterial({map:earthTex});
    mEarth = new THREE.Mesh(geometry, cubeMat);
    mEarth.position.z = 4;
    mSolarSystem.add(mEarth);
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
    initLight();
    initObject();
    render();
}