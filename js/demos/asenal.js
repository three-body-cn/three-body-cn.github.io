import { ModelLoader } from './ModelLoader.js';

class Asenal {
    constructor() {
        this.mFighters = [
            "./model/Fighters/AH-64D-Apache-Longbow/AH-64D-Apache-Longbow.fbx"
        ];
        
		this.init();
    }

    init() {
        this.initThree();
        this.initCamera();
        this.initScene();
        this.initSkyBox();
        this.initLight();
        this.initModelLoader();
        this.initEventListeners();
    }

    initThree() {
        const self = this;
        this.mRenderer = new THREE.WebGLRenderer({
            antialias : true, alpha: true
        });
        this.mRenderTarget = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight);
        this.mRenderer.shadowMap.enabled = true;
        this.mRenderer.shadowMap.type = THREE.PCFSoftShadowMap; // 默认的是THREE.PCFShadowMap，没有设置的这个清晰 
        this.mRenderer.shadowCameraNear = 0.5;
        this.mRenderer.shadowCameraFar = 1000;
        this.mRenderer.shadowMapWidth = 4096;
        this.mRenderer.shadowMapHeight = 4096;
        this.mRenderer.setSize(window.innerWidth, window.innerHeight);
        // add layout
        // this.mContainer = document.createElement('div');
        // document.body.appendChild(this.mContainer);
        this.mContainer = document.getElementById('canvas-frame')
        this.mContainer.appendChild(this.mRenderer.domElement);
        this.mRenderer.setClearColor(0xffffff, 1.0);
        // this.mRenderer.gammaInput = true;
        // this.mRenderer.gammaOutput = true;
    
        this.mStats = new Stats();
        this.mStats.domElement.style.position = 'absolute';
        this.mStats.domElement.style.left = '10px';
        this.mStats.domElement.style.top = '50px';

        this.mContinuous = true;
    
        // onSurfaceChanged
        window.addEventListener('resize', function(){self.onWindowResize();}, false);
    }

    initCamera() {
        this.mCamera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 5000);
        this.mCamera.position.set(0, 100, 200);

        // 创建控件并绑定在相机上
        this.mOrbitControl = new THREE.OrbitControls(this.mCamera, this.mRenderer.domElement);
        this.mOrbitControl.target = new THREE.Vector3(0, 0, 0);
        this.mOrbitControl.autoRotate = false;
        this.mOrbitControl.minDistance = 1;
        this.mOrbitControl.maxDistance = 750;
        this.mOrbitControl.update();
        this.mOrbitControl.maxPolarAngle = Math.PI / 2;
    }

    initScene() {
        this.mScene = new THREE.Scene();
        this.mScene.background = new THREE.Color(0xa0a0a0);
        // this.mScene.fog = new THREE.Fog(0xa0a0a0, 100, 1000);

        this.mAxis = new THREE.AxesHelper(500);
        this.mAxis.material.visible = false;
        this.mScene.add(this.mAxis);

        this.mLoadingManager = new THREE.LoadingManager();
        this.mLoadingManager.onLoad = function () {
            // call back function when the texture gets loaded
        }
        this.mTextureLoader = new THREE.TextureLoader(this.mLoadingManager);
    }

    initSkyBox() {

    }

    initLight() {
        this.mAmbientLight = new THREE.AmbientLight(this.DAY_AMBIENT_COLOR, 1);
        this.mScene.add(this.mAmbientLight);

        this.mDirectionalLight = new THREE.DirectionalLight(this.DAY_DIRECTION_LIGHT_COLOR, 1.0);
        this.mDirectionalLight.position.set(900, 900, 900);
        this.mDirectionalLight.target.position.set(0, 0, 0);
        // this.mDirectionalLight.shadowCameraVisible = true;
        this.mDirectionalLight.castShadow = true;
        this.mDirectionalLight.shadow.camera.near = 0.5;
        this.mDirectionalLight.shadow.camera.far = 5000;
        this.mDirectionalLight.shadow.camera.top = 1800;
        this.mDirectionalLight.shadow.camera.bottom = -1000;
        this.mDirectionalLight.shadow.camera.left = -1200;
        this.mDirectionalLight.shadow.camera.right = 1200;
        this.mScene.add(this.mDirectionalLight);

        this.mSpotLight = new THREE.SpotLight(this.DAY_SPOTLIGHT_COLOR, 0.2);
        this.mSpotLight.position.set(0, 275, -45);
        this.mSpotLight.angle = Math.PI / 8; // 设置聚光光源发散角度
        this.mSpotLight.castShadow = true;
        this.mSpotLight.receiveShadow = true;
        this.mSpotLight.shadow.camera.near = 0.5;
        this.mSpotLight.shadow.camera.far = 200;
        this.mSpotLight.shadow.camera.width = 1000;
        this.mSpotLight.shadow.camera.height = 1000;
        this.mScene.add(this.mSpotLight);

        // lens flare
        var lensFlareTex0 = this.mTextureLoader.load("./texture/LensFlare/lensflare0.png");
        var lensFlareTex2 = this.mTextureLoader.load("./texture/LensFlare/lensflare2.png");
        var lensFlareTex3 = this.mTextureLoader.load("./texture/LensFlare/lensflare3.png");
        const flareColor = new THREE.Color(0xffffff);
        flareColor.setHSL(0.55, 0.9, 1.0);
        // need new version of Lensflare and three.js
        // var this.mLensFlare = new Lensflare();
        // this.mLensFlare.addElement(new LensflareElement(lensFlareTex1, 512, 0));
        // this.mLensFlare.addElement(new LensflareElement(lensFlareTex2, 512, 0));
        // this.mLensFlare.addElement(new LensflareElement(lensFlareTex3, 60, 0.6));
        // this.mDirectionalLight.add(this.mLensFlare);

        this.mLensFlare = new THREE.Lensflare();
        this.mLensFlare.addElement(new THREE.LensflareElement(lensFlareTex0, 500, 0.0, flareColor));
        this.mLensFlare.addElement(new THREE.LensflareElement(lensFlareTex2, 512, 0.0));
        this.mLensFlare.addElement(new THREE.LensflareElement(lensFlareTex2, 512, 0.0));
        this.mLensFlare.addElement(new THREE.LensflareElement(lensFlareTex2, 512, 0.0));
        this.mLensFlare.addElement(new THREE.LensflareElement(lensFlareTex3, 60, 0.6));
        this.mLensFlare.addElement(new THREE.LensflareElement(lensFlareTex3, 70, 0.7));
        this.mLensFlare.addElement(new THREE.LensflareElement(lensFlareTex3, 120, 0.9));
        this.mLensFlare.addElement(new THREE.LensflareElement(lensFlareTex3, 70, 1.0));
        this.mLensFlare.position.copy(this.mSpotLight.position);
        // this.mDirectionalLight.add(this.mLensFlare);
        this.mScene.add(this.mLensFlare);
    }

    initModelLoader() {
        this.modelLoader = new ModelLoader(this.mScene, this.envMap);
        this.modelLoader.loadModel('J15A');

        this.render();
    }

    render() {
        this.mRenderer.clear();
        this.mRenderer.render(this.mScene, this.mCamera);
        // this.mRenderer.setFaceCulling(THREE.CullFaceBack);

        if (null != this.mStats)
            this.mStats.update();

        const self = this;
        if (this.mContinuous) {
            requestAnimationFrame(function(){ 
                self.render(); 
            });
        }
    }

    onWindowResize() {
        this.mCamera.aspect = window.innerWidth / window.innerHeight;
        this.mCamera.updateProjectionMatrix();
        this.mRenderer.setSize(window.innerWidth, window.innerHeight);
        this.mRenderTarget.setSize(window.innerWidth, window.innerHeight);
    }

    onKeyPress(event) {

    }

    initEventListeners() {
        const self = this;
        document.getElementById('modelForm').addEventListener('change', (event) => {
            const selectedModel = event.target.value;
            self.clearScene();
            self.modelLoader.loadModel(selectedModel);
        });
    }

    clearScene() {
        const objectsToKeep = [this.mAmbientLight, this.mDirectionalLight, this.mSpotLight, this.mLensFlare];
        this.mScene.children = this.mScene.children.filter((child) => objectsToKeep.includes(child));
        // while (this.mScene.children.length > 0) {
        //     this.mScene.remove(this.mScene.children[0]);
        // }
    }
}

export {Asenal};