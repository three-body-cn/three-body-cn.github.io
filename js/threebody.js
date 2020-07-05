Physijs.scripts.worker = './js/public/three/physijs_worker.js';
Physijs.scripts.ammo = 'ammo.js';

var mUniverse;
var mOrbitControls;
var mGLScene;
var mSimData = ''
var mDataLoader = new DataLoader()
var mShowAssist = false;
var mPrintLog = false;
var mGLView = null;
var mTimeOut = null;

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
            if (null != mGLScene) {
                if (mShowAssist) {
                    mGLView.appendChild(mGLScene.mStats.domElement);
                } else {
                    mGLView.removeChild(mGLScene.mStats.domElement);
                }
            }
            break;
        case 'P':
        case 'p':
            mPrintLog = !mPrintLog;
            if (null != mGLScene) {
                mGLScene.updateStatus(mShowAssist, mPrintLog);
            }
            break;
        default:
            break;
    }
}

function onWindowResize() {
    if (undefined != mUniverse) {
        mUniverse.mScene.onWindowResize();
    }
}

function createUIController(scene) {
    mOrbitControls = new THREE.OrbitControls(scene.mCamera, scene.mRenderer.domElement);
    mOrbitControls.target = new THREE.Vector3(0, 0, 0);
    mOrbitControls.autoRotate = false;
    mOrbitControls.minDistance = 100;
    mOrbitControls.maxDistance = 10000;
}

function handleMouseDown() {
    if (undefined != mTimeOut) 
        window.clearTimeout(mTimeOut);
    mGLScene.updateStatus(mShowAssist, mPrintLog, true);
}

function handleMouseUp() {
    mTimeOut = setTimeout(recoverMouseViewStatus, 5000);
}

function handleMouseMove() {
    
}

function handleMouseOut() {
    
}

function recoverMouseViewStatus() {
    mGLScene.updateStatus(mShowAssist, mPrintLog, false);
}

function main() {
    mGLView = document.getElementById('canvas-frame');
    // mouse
    mGLView.onmousedown = handleMouseDown;
    mGLView.onmouseup = handleMouseUp;
    mGLView.onmousemove = handleMouseMove;
    mGLView.onmouseout = handleMouseOut;

    // onSurfaceChanged
    window.addEventListener('resize', onWindowResize, false);

    mDataLoader.loadSimData('three-solar-system.json', function(data) {
        mSimData = JSON.stringify(data, null, "\t")
    });
    if (mSimData == undefined) {
        alert('illegal mSimData')
        return
    }

    try {
        mUniverse = new Universe();
        mUniverse.start(function(scene) {
            mGLScene = scene;
            createUIController(scene);
        }, JSON.parse(mSimData))
    } catch (e) {
        alert('illegal data:' + e);
    }
}