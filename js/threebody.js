Physijs.scripts.worker = './js/public/three/physijs_worker.js';
Physijs.scripts.ammo = 'ammo.js';

var mCivilizationNum = 0;
var mStartTime = 0;
var mUniverse;
var mOrbitControls;
var mGLScene;
var mSimData = ''
var mDataLoader = new DataLoader()
var mShowAssist = false;
var mPrintLog = false;
var mGLView = null;
var mTimeOut = null;

var LEVEL_NAMES = ['原始时代', '石器时代', '冷兵器时代', '帝国时代', '火器时代', '蒸汽时代', '电气时代', '原子信息时代'];

function getCivilizationYear() {
    return Math.floor((Date.now() - mStartTime) / 1000);
}

function getCivilizationLevel(year) {
    return LEVEL_NAMES[Math.min(7, Math.floor(year / 1000))];
}

// 对星体初始参数加入随机扰动，维持三体引力束缚
// 位置 ±50（约间距的12%），速度 ±15（约速度的10%），远低于逃逸速度 ~258
function randomizeConfig(configData) {
    var result = JSON.parse(JSON.stringify(configData));
    function rand(range) { return (Math.random() - 0.5) * 2 * range; }
    for (var i = 0; i < result.asters.length; i++) {
        var a = result.asters[i];
        if (a.type !== 0) continue;
        a.pos.x += rand(50); a.pos.y += rand(50); a.pos.z += rand(50);
        a.initVelocity.x += rand(15); a.initVelocity.y += rand(15); a.initVelocity.z += rand(15);
    }
    return result;
}

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
                mGLScene.updateStatus(mShowAssist, mPrintLog);
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

function handleTouchMove() {

}

function handleTouchStart() {
    if (undefined != mTimeOut) 
        window.clearTimeout(mTimeOut);
    mGLScene.updateStatus(mShowAssist, mPrintLog, true);
}

function handleTouchEnd() {
    mTimeOut = setTimeout(recoverMouseViewStatus, 5000);
}

function handleTouchCancel() {

}

function handleMouseMove() {
}

function handleMouseOut() {
}

function handleMouseWheel() {
    console.log('handleMouseWheel');
}

function recoverMouseViewStatus() {
    mGLScene.updateStatus(mShowAssist, mPrintLog, false);
}

function disasterHappened(disasterType, id, year, level) {
    if (disasterType == DisasterType.STAR_COLLISION) {
        alertDialog('第' + id + '号文明毁灭于双日相撞，该文明持续了' + year + '年，该文明进化至' + level + '。<br/>文明的种子仍在，它将重新启动，继续在三体世界中命运莫测的进化。', 10000, restartUniverse);
    } else if (disasterType == DisasterType.STAR_EAT_EARTH) {
        alertDialog('第' + id + '号文明在烈焰中被毁灭了，该文明持续了' + year + '年，该文明进化至' + level + '。<br/>文明的种子仍在，它将重新启动，继续在三体世界中命运莫测的进化。', 10000, restartUniverse);
    } else if (disasterType == DisasterType.THREE_SOLAR_FAR_AWAY) {
        alertDialog('这一夜持续了' + year + '年，第' + id + '号文明毁灭于漫长的严寒岁月，该文明进化至' + level + '。<br/>文明的种子仍在，它将重新启动，继续在三体世界中命运莫测的进化。', 10000, restartUniverse);
    }
}

function restartUniverse() {
    sessionStorage.setItem('civilizationId', mCivilizationNum + 1);
    location.reload();
}

function main() {
    mGLView = document.getElementById('canvas-frame');
    // mouse
    mGLView.onmousedown = handleMouseDown;
    mGLView.onmouseup = handleMouseUp;
    mGLView.onmousemove = handleMouseMove;
    mGLView.onmouseout = handleMouseOut;
    mGLView.ontouchmove = handleTouchMove;
    mGLView.ontouchstart = handleTouchStart;
    mGLView.ontouchend = handleTouchEnd;
    mGLView.ontouchcancel = handleTouchCancel;
	mGLView.addEventListener('mousewheel', handleMouseWheel, false);
	mGLView.addEventListener('DOMMouseScroll', handleMouseWheel, false); // firefox

    // onSurfaceChanged
    window.addEventListener('resize', onWindowResize, false);

    mCivilizationNum = parseInt(sessionStorage.getItem('civilizationId') || '1');
    mStartTime = Date.now();

    mDataLoader.loadSimData('three-solar-system.json', function(data) {
        mSimData = JSON.stringify(data, null, "\t")
    });
    if (mSimData == undefined) {
        alert('illegal mSimData')
        return
    }

    try {
        mUniverse = new Universe(
            function(center) {
                mOrbitControls.target = center;
            }
        );
        mUniverse.start(
            function(scene) {
                mGLScene = scene;
                createUIController(scene);
            },
            function(disasterType) {
                var year = getCivilizationYear();
                var level = getCivilizationLevel(year);
                disasterHappened(disasterType, mCivilizationNum, year, level);
            },
            randomizeConfig(JSON.parse(mSimData)))
    } catch (e) {
        alert('illegal data:' + e);
    }
}