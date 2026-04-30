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
/** 太阳日冕：Group，内含内层细丝 + 外层光晕两层 Mesh，updateScene 里统一刷 time */
var mSunCorona;
var mSunSurfaceMaterial;
var mClock;
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
 * 生成径向渐变 Canvas，用作 Sprite 的纹理。
 * Sprite 始终朝向相机，适合模拟“光晕光斑”；与球壳日冕叠加时应用加性混合，并关闭 depthWrite 避免错误遮挡。
 *
 * @param color 颜色分量字符串，如 "255, 210, 140"
 * @returns {HTMLCanvasElement} 供 THREE.CanvasTexture 使用
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

/**
 * 创建太阳：实心表面 + 两层日冕（内层日珥细丝、外层扩散晕）。
 *
 * 之前单壳 DoubleSide + 片元里用固定 Z 轴算“边缘”+ 全表面噪声，容易叠成均匀的半透明球壳。
 * 这里改为：
 * - 用视空间视线与法线的夹角算 Fresnel 边缘项（正对相机几乎为 0，只有轮廓亮）；
 * - 噪声只乘在边缘项上，中心不再叠半透明层；
 * - 顶点沿法线轻微位移，打破完美同心圆；
 * - 内/外两层球壳半径不同：外层轮廓比光球大，光从边缘“溢出去”，而不是贴在同一半径上；
 * - Three.js 非预乘 alpha 下 AdditiveBlending 为 blendFunc(SRC_ALPHA, ONE)，
 *   即 final += srcRGB * srcAlpha，因此 RGB 写亮度、alpha 写贡献强度即可。
 */
function createSun(scene) {
    var SUN_RADIUS = 7;

    // -------------------------------------------------------------------------
    // 太阳表面：贴图 + UV 扰动（翻滚感），与 Sceneform 里“有纹理的发光球”一致思路
    // -------------------------------------------------------------------------
    var sunTex = THREE.ImageUtils.loadTexture("model/Solar/Sol_Opaque_Mat_baseColor.png", null, function(t){});
    sunTex.wrapS = sunTex.wrapT = THREE.RepeatWrapping;

    var sunSurfaceVS = [
        "// 太阳表面顶点：输出 UV 与视空间法线，供片元做边缘提亮",
        "varying vec2 vUv;",
        "varying vec3 vNormal;",
        "void main() {",
        "  vUv = uv;",
        "  vNormal = normalize(normalMatrix * normal);",
        "  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);",
        "}"
    ].join("\n");

    var sunSurfaceFS = [
        "uniform float time;",
        "uniform sampler2D map;",
        "uniform vec3 color;",
        "uniform float emissiveStrength;",
        "uniform float distortionStrength;",
        "varying vec2 vUv;",
        "varying vec3 vNormal;",

        "// ---- 2D 值噪声 + 分形叠加（fbm），用于 UV 扭曲与温度细节 ----",
        "float hash(vec2 p){",
        "  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);",
        "}",
        "float noise(vec2 p){",
        "  vec2 i = floor(p);",
        "  vec2 f = fract(p);",
        "  float a = hash(i);",
        "  float b = hash(i + vec2(1.0, 0.0));",
        "  float c = hash(i + vec2(0.0, 1.0));",
        "  float d = hash(i + vec2(1.0, 1.0));",
        "  vec2 u = f * f * (3.0 - 2.0 * f);",
        "  return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;",
        "}",
        "float fbm(vec2 p){",
        "  float v = 0.0;",
        "  float a = 0.5;",
        "  mat2 m = mat2(1.6, -1.2, 1.2, 1.6);",
        "  for(int i=0;i<4;i++){",
        "    v += a * noise(p);",
        "    p = m * p;",
        "    a *= 0.5;",
        "  }",
        "  return v;",
        "}",

        "void main(){",
        "  // 用 fbm 偏移 UV，让贴图呈等离子翻滚（非物理，但观感接近动态光球）",
        "  vec2 p = vUv * 6.0;",
        "  float n1 = fbm(p + vec2(time * 0.25, -time * 0.18));",
        "  float n2 = fbm(p * 1.8 + vec2(-time * 0.12, time * 0.22));",
        "  vec2 duv = vec2(n1 - 0.5, n2 - 0.5) * distortionStrength;",
        "  vec2 uv = vUv + duv;",

        "  vec3 base = texture2D(map, uv).rgb;",
        "  float hot = smoothstep(0.35, 0.95, n1);",
        "  vec3 ramp = mix(vec3(1.0, 0.55, 0.08), vec3(1.0, 0.92, 0.55), hot);",
        "  vec3 c = base * 0.65 + ramp * 0.65;",

        "  // 注意：这里若再用固定 Z 轴算边缘会随相机绕转而失真；表面层用简单 rim 即可",
        "  vec3 viewN = normalize(vNormal);",
        "  float ndv = clamp(dot(viewN, vec3(0.0, 0.0, 1.0)) * 0.5 + 0.5, 0.0, 1.0);",
        "  float glow = pow(1.0 - ndv, 2.0);",
        "  c += glow * vec3(1.0, 0.65, 0.2) * 0.35;",

        "  c *= emissiveStrength;",
        "  gl_FragColor = vec4(c, 1.0);",
        "}"
    ].join("\n");

    mSunSurfaceMaterial = new THREE.ShaderMaterial({
        uniforms: {
            time: { value: 0.0 },
            map: { value: sunTex },
            color: { value: new THREE.Color(0xffcc66) },
            emissiveStrength: { value: 1.35 },
            distortionStrength: { value: 0.035 }
        },
        vertexShader: sunSurfaceVS,
        fragmentShader: sunSurfaceFS
    });

    var sunGeo = new THREE.SphereGeometry(SUN_RADIUS, 64, 64);
    var sunMesh = new THREE.Mesh(sunGeo, mSunSurfaceMaterial);
    sunMesh.renderOrder = 0;

    // -------------------------------------------------------------------------
    // 日冕：共用一套着色器，通过 uniform 区分内层（亮、细、贴轮廓）与外层（淡、大半径）
    // -------------------------------------------------------------------------
    var coronaVS = [
        "// 日冕顶点：输出视空间位置（算真实视线方向）、法线、模型空间球心方向（做球面火焰 UV）",
        "uniform float time;",
        "uniform float displacementScale;",
        "varying vec3 vNormal;",
        "varying vec3 vViewPos;",
        "varying vec3 vModelDir;",
        "void main(){",
        "  vModelDir = normalize(position);",
        "  vNormal = normalize(normalMatrix * normal);",
        "  // 沿法线低频起伏：破坏“完美玻璃球壳”的均匀感，轮廓会有轻微抖动",
        "  vec3 pos = position;",
        "  float bump = sin(pos.x * 4.2 + time * 1.35) * cos(pos.y * 3.7 - time * 0.95) * cos(pos.z * 3.1 + time * 1.05);",
        "  pos = pos + normal * (0.14 * bump * displacementScale);",
        "  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);",
        "  vViewPos = mvPosition.xyz;",
        "  gl_Position = projectionMatrix * mvPosition;",
        "}"
    ].join("\n");

    var coronaFS = [
        "// 日冕片元：加性混合下 alpha 为“叠加强度”，RGB 为光色",
        "uniform float time;",
        "uniform vec3 color;",
        "uniform float intensity;",
        "uniform float rimPower;",
        "uniform float flameScale;",
        "varying vec3 vNormal;",
        "varying vec3 vViewPos;",
        "varying vec3 vModelDir;",

        "float hash(vec2 p){ return fract(sin(dot(p, vec2(41.7, 289.3))) * 43758.5453); }",
        "float noise(vec2 p){",
        "  vec2 i = floor(p), f = fract(p);",
        "  float a = hash(i);",
        "  float b = hash(i + vec2(1.0,0.0));",
        "  float c = hash(i + vec2(0.0,1.0));",
        "  float d = hash(i + vec2(1.0,1.0));",
        "  vec2 u = f*f*(3.0-2.0*f);",
        "  return mix(a,b,u.x) + (c-a)*u.y*(1.0-u.x) + (d-b)*u.x*u.y;",
        "}",
        "float fbm(vec2 p){",
        "  float v=0.0,a=0.5;",
        "  for(int i=0;i<5;i++){ v += a*noise(p); p*=2.02; a*=0.5; }",
        "  return v;",
        "}",

        "void main(){",
        "  // 视空间：相机在原点，表面指向相机的方向 viewDir；法线 vNormal 已乘 normalMatrix",
        "  vec3 viewDir = normalize(-vViewPos);",
        "  float NdotV = clamp(dot(normalize(vNormal), viewDir), 0.001, 1.0);",
        "  // rim：掠射角大（N·V 小）→ 亮；正对相机（N·V≈1）→ 接近 0，避免整球蒙一层",
        "  float rim = pow(1.0 - NdotV, rimPower);",

        "  // 用球面方向 (方位角、极角) 采样噪声，并沿时间流动，模拟日冕细丝/火焰",
        "  vec3 r = normalize(vModelDir);",
        "  float phi = atan(r.z, r.x);",
        "  float theta = acos(clamp(r.y, -1.0, 1.0));",
        "  vec2 uv = vec2(phi, theta) * flameScale * vec2(3.0, 5.5);",
        "  uv += vec2(time * 0.55, -time * 1.25);",
        "  float f1 = fbm(uv);",
        "  float f2 = fbm(uv * 2.6 + vec2(-time * 0.35, time * 0.65));",
        "  float flame = clamp(f1 * 0.62 + f2 * 0.48, 0.0, 1.0);",
        "  flame = pow(flame, 0.82);",

        "  // 关键：所有半透明贡献都必须再乘 rim，噪声不得单独加 alpha（否则会像套一层雾）",
        "  float flicker = 0.88 + 0.12 * sin(time * 2.1 + phi * 3.0);",
        "  float alpha = rim * (0.12 + 0.92 * flame) * flicker * intensity;",
        "  vec3 hot = mix(color, vec3(1.0, 0.92, 0.55), flame * 0.55);",
        "  vec3 rgb = hot * (0.45 + 0.85 * flame + 0.35 * rim);",

        "  gl_FragColor = vec4(rgb, clamp(alpha, 0.0, 1.0));",
        "}"
    ].join("\n");

    function makeCoronaMesh(radius, uniforms, renderOrder) {
        var mat = new THREE.ShaderMaterial({
            uniforms: uniforms,
            vertexShader: coronaVS,
            fragmentShader: coronaFS,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            depthTest: true,
            // 只画正面：避免 DoubleSide 时背面再叠一层，加重“肥皂泡”感
            side: THREE.FrontSide,
            polygonOffset: true,
            polygonOffsetFactor: -1,
            polygonOffsetUnits: -1
        });
        var mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 64, 64), mat);
        mesh.renderOrder = renderOrder;
        return mesh;
    }

    var coronaInner = makeCoronaMesh(SUN_RADIUS * 1.05, {
        time: { value: 0.0 },
        color: { value: new THREE.Color(0xff9933) },
        intensity: { value: 1.15 },
        rimPower: { value: 5.2 },
        flameScale: { value: 1.05 },
        displacementScale: { value: 1.0 }
    }, 1);

    var coronaOuter = makeCoronaMesh(SUN_RADIUS * 1.28, {
        time: { value: 0.0 },
        color: { value: new THREE.Color(0xffcc66) },
        intensity: { value: 0.42 },
        rimPower: { value: 4.0 },
        flameScale: { value: 0.72 },
        displacementScale: { value: 0.65 }
    }, 2);

    mSunCorona = new THREE.Group();
    mSunCorona.add(coronaInner);
    mSunCorona.add(coronaOuter);

    // 日冕挂在光球下，随 mSun 自转，火焰纹理与球面一起转，更整体
    sunMesh.add(mSunCorona);

    mSunGroup = new THREE.Group();
    mSunGroup.add(sunMesh);
    scene.add(mSunGroup);

    mSun = sunMesh;
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
    // Slightly nicer highlights on older three builds (safe no-op on newer)
    mRenderer.gammaInput = true;
    mRenderer.gammaOutput = true;

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
    // Warm sunlight with gentle decay
    mPointLight = new THREE.PointLight(0xfff1cc, 1.35, 1500, 0.2);
    mPointLight.castShadow = true;
    mPointLight.position.set(0, 0, 0);
    mSolarSystem.add(mPointLight);
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

    // 太阳：Shader 光球 + 两层日冕（逻辑在 createSun 内，含详细着色器注释）
    createSun(mSolarSystem);

    // 额外 Sprite 光晕：弥补远处观看时日冕在屏幕上像素占比变小、整体偏暗的问题（Billboard + 加性混合）
    mSunLight = new THREE.Sprite(new THREE.SpriteMaterial({
        map: new THREE.CanvasTexture(generateSprite("255, 210, 140")),
        blending: THREE.AdditiveBlending,
        transparent: true,
        depthWrite: false
    }));
    mSunLight.scale.x = mSunLight.scale.y = mSunLight.scale.z = 38;
    mSolarSystem.add(mSunLight);
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
    // Clock 必须全局唯一：每帧 getElapsedTime() 才连续，太阳 Shader 的 time 才能平滑动画
    if (!mClock) mClock = new THREE.Clock();
    var delta = mClock.getDelta();
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
    var t = mClock ? mClock.getElapsedTime() : 0.0;
    if (mSunSurfaceMaterial && mSunSurfaceMaterial.uniforms && mSunSurfaceMaterial.uniforms.time) {
        mSunSurfaceMaterial.uniforms.time.value = t;
    }
    // 日冕为 Group，内/外两层各自一份 ShaderMaterial，需统一刷新 time
    if (mSunCorona) {
        mSunCorona.traverse(function (obj) {
            if (obj.material && obj.material.uniforms && obj.material.uniforms.time) {
                obj.material.uniforms.time.value = t;
            }
        });
    }
    if (mSunLight) {
        // subtle pulsation
        var s = 38 * (0.95 + 0.06 * Math.sin(t * 1.7));
        mSunLight.scale.set(s, s, s);
    }
    for (var i = 0; i < mPlanets.length; i++) {
        mPlanets[i].group.rotation.y -= mPlanets[i].speed;  // 公转
        // 自转
        mPlanets[i].planet.rotation.x += mPlanets[i].rotation.x;
        mPlanets[i].planet.rotation.y -= mPlanets[i].rotation.y;
    }
    mSun.rotation.y -= 0.004;   // 太阳自转速度
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