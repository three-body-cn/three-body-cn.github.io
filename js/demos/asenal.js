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
        this.initModel();
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

    initModel() {
        const self = this;
        // self.loadXitaiModel();
        // self.loadSu35Model();
        // self.loadSu27Model();
        // self.loadFC31Model();
        self.loadJ15AModel();
        // self.loadAH64DModel();
    }

    loadAH64DModel() {
        const self = this;
        const modelPath = './model/Fighters/AH-64D-Apache-Longbow/';
        const modelFile = 'AH-64D-Apache-Longbow.fbx';
        
        // 1. 初始化加载器
        const textureLoader = new THREE.TextureLoader();

        // 2. 定义材质数组（根据贴图命名规律）
        const materials = [
            // mat0: 主机身材质
            new THREE.MeshPhysicalMaterial({
                map: textureLoader.load(`${modelPath}mat0_c.jpg`),       // 漫反射
                normalMap: textureLoader.load(`${modelPath}mat0_n.png`), // 法线
                roughnessMap: textureLoader.load(`${modelPath}mat0_r.jpg`), // 粗糙度
                metalnessMap: textureLoader.load(`${modelPath}mat0_g.jpg`), // 金属度（gloss贴图）
                envMap: this.envMap,                                    // 环境贴图
                side: THREE.DoubleSide
            }),
            // mat1: 副材质（如武器/细节）
            new THREE.MeshPhysicalMaterial({
                map: textureLoader.load(`${modelPath}mat1_c.jpg`),
                normalMap: textureLoader.load(`${modelPath}mat1_n.png`),
                roughnessMap: textureLoader.load(`${modelPath}mat1_r.jpg`),
                metalnessMap: textureLoader.load(`${modelPath}mat1_g.jpg`),
                envMap: this.envMap,
                side: THREE.DoubleSide
            }),
            // mat2: 透明部件（如玻璃座舱）
            new THREE.MeshPhysicalMaterial({
                map: textureLoader.load(`${modelPath}mat2_c.jpg`),
                alphaMap: textureLoader.load(`${modelPath}mat2_a.jpg`), // 透明通道
                normalMap: textureLoader.load(`${modelPath}mat2_n.png`),
                roughnessMap: textureLoader.load(`${modelPath}mat2_r.jpg`),
                metalnessMap: textureLoader.load(`${modelPath}mat2_g.jpg`),
                transparent: true,
                opacity: 0.8,
                envMap: this.envMap,
                side: THREE.DoubleSide
            }),
            // mat3: 特殊材质（如自发光部件）
            new THREE.MeshPhysicalMaterial({
                map: textureLoader.load(`${modelPath}mat3_g.jpg`),      // 可能为发光贴图
                alphaMap: textureLoader.load(`${modelPath}mat3_a.jpg`),
                roughnessMap: textureLoader.load(`${modelPath}mat3_r.jpg`),
                emissive: new THREE.Color(0x555555),
                emissiveIntensity: 1.5,
                envMap: this.envMap,
                side: THREE.DoubleSide
            })
        ];

        // 3. 加载FBX模型并分配材质
        try {
            var apacheLoader = new THREE.FBXLoader();
            apacheLoader.setCrossOrigin("Anonymous");
            apacheLoader.load(`${modelPath}${modelFile}`, function(object) {
                object.traverse(function(child) {
                    if (child.isMesh) {    //  instanceof THREE.Mesh
                        console.log('loaded apache obj mesh:' + child.material.name);
                        child.material = materials;
                        child.castShadow = true;
                        child.receiveShadow = true; // 接收阴影
                    }
                });
                object.position.set(0, 0, 0);
                object.scale.set(10, 10, 10)
                // object.rotateY(-Math.PI / 2);

                self.mScene.add(object);

                self.render();
            })
        } catch (error) {
            console.error('模型加载失败:', error);
        }
    }

    loadJ15AModel() {
        const self = this;
        // 1. 创建材质数组（与 .mtl 中的 4 个材质定义对应）
        const materials = new THREE.MeshPhysicalMaterial({
            color: 0xffffff,  // 基础色（会被漫反射贴图覆盖）
            
            // 绑定 PBR 贴图
            map: new THREE.TextureLoader().load('./model/Fighters/J-15A/J-15_diffuse.jpg'),       // 漫反射贴图
            normalMap: new THREE.TextureLoader().load('./model/Fighters/J-15A/J-15_normal.jpg'),  // 法线贴图
            metalnessMap: new THREE.TextureLoader().load('./model/Fighters/J-15A/J-15_metalness.jpg'), // 金属度贴图
            roughnessMap: new THREE.TextureLoader().load('./model/Fighters/J-15A/J-15_roughness.jpg'), // 粗糙度贴图
            emissiveMap: new THREE.TextureLoader().load('./model/Fighters/J-15A/J-15_emissive.jpg'),   // 自发光贴图
            emissiveIntensity: 1.0,  // 自发光强度
            
            // 物理材质参数
            metalness: 1.0,  // 由 metalnessMap 控制，此处设为最大值
            roughness: 1.0,  // 由 roughnessMap 控制
            envMap: this.mEnvMap, // 环境贴图（用于反射）
            
            // 其他优化
            side: THREE.DoubleSide,  // 双面渲染（可选）
            transparent: true,       // 如果需要透明度
        });

        // 2. 加载 OBJ 模型并绑定材质
        const objLoader = new THREE.OBJLoader();
        objLoader.load(
            './model/Fighters/J-15A/J-15.obj',
            function (object) {
                object.traverse(function (child) {
                    if (child.isMesh) {
                        console.log('loaded J15A obj mesh:' + child.material.name);
                        // 统一应用 PBR 材质
                        child.material = materials;
                        child.castShadow = true;
                        child.receiveShadow = true;
                    }
                });
                // 调整模型位置和缩放
                object.position.set(0, 0, 0);
                object.scale.set(50, 50, 50);
                self.mScene.add(object);
                self.render();
            },
            function (progress) {
                console.log('加载进度:', (progress.loaded / progress.total) * 100 + '%');
            },
            function (error) {
                console.error('模型加载失败:', error);
            }
        );
    }

    loadFC31Model() {
        const self = this;
        // 1. 创建材质数组（与 .mtl 中的 4 个材质定义对应）
        const materials = [
            new THREE.MeshPhysicalMaterial({
                color: new THREE.Color(0xffffff),
                metalness: 0.3,
                roughness: 0.7,
                map: new THREE.TextureLoader().load('./model/Fighters/FC-31/FC-31.jpg')
            }),
        ];

        // 2. 加载 OBJ 模型并绑定材质
        const objLoader = new THREE.OBJLoader();
        objLoader.load(
            './model/Fighters/FC-31/FC-31.obj',
            function (object) {
                object.traverse(function (child) {
                    if (child.isMesh) {
                        console.log('loaded fc31 obj mesh:' + child.material.name);
                        child.material = materials[0];
                        child.castShadow = true;
                        child.receiveShadow = true;
                    }
                });
                // 调整模型位置和缩放
                object.position.set(0, 0, 0);
                object.scale.set(1, 1, 1);
                self.mScene.add(object);
                self.render();
            },
            function (progress) {
                console.log('加载进度:', (progress.loaded / progress.total) * 100 + '%');
            },
            function (error) {
                console.error('模型加载失败:', error);
            }
        );
    }

    loadSu27Model() {
        const self = this;
        // 1. 创建材质数组（与 .mtl 中的 4 个材质定义对应）
        const materials = [
            // 材质 0: plane (机身)
            new THREE.MeshPhysicalMaterial({
                color: new THREE.Color(0xffffff), // Kd 1,1,1
                metalness: 0.3,                   // 近似 Ks 0.75
                roughness: 0.7,                   // 根据 Ns 8 调整
                map: new THREE.TextureLoader().load('./model/Fighters/Su-27/Su-27_diffuse.png'), // map_Kd
                normalMap: new THREE.TextureLoader().load('./model/Fighters/Su-27/Su-27_normal.png'), // map_bump
                transparent: true,                // 如果有透明部分
                side: THREE.DoubleSide            // 双面渲染（可选）
            }),
            // 材质 1: glass (座舱玻璃)
            null,
            // new THREE.MeshPhysicalMaterial({
            //     color: new THREE.Color(0xffffff),
            //     metalness: 0.8,                   // 高反射
            //     roughness: 0.1,
            //     map: new THREE.TextureLoader().load('./model/Fighters/Su-27/Glass_Cockpit.png'),
            //     transparent: true,
            //     opacity: 0.7,                     // 调整透明度
            //     envMap: this.mEnvMap               // 环境贴镜面反射
            // }),
            // 材质 2: seat (弹射座椅)
            new THREE.MeshPhysicalMaterial({
                color: new THREE.Color(0xffffff),
                metalness: 0.3,
                roughness: 0.7,
                map: new THREE.TextureLoader().load('./model/Fighters/Su-27/Su-27_ejectseat.png') // map_Kd
            }),
            // 材质 3: pilot (飞行员)
            new THREE.MeshPhysicalMaterial({
                color: new THREE.Color(0xffffff),
                metalness: 0.1,
                roughness: 0.9,
                map: new THREE.TextureLoader().load('./model/Fighters/Su-27/Su-27_pilot.png') // map_Kd
            })
        ];

        // 2. 加载 OBJ 模型并绑定材质
        const objLoader = new THREE.OBJLoader();
        objLoader.load(
            './model/Fighters/Su-27/Su-27.obj',
            function (object) {
                object.traverse(function (child) {
                    if (child.isMesh) {
                        console.log('loaded su27 mesh:' + child.material.name);
                        // 根据子网格的材质名称分配材质
                        switch (child.material.name) {
                            case 'Su_27__Su_27_Flankerplane':
                                child.material = materials[0];
                                break;
                            case 'Su_27__Su_27_Flankerglass':
                                // child.material = materials[1];
                                break;
                            case 'Su_27__Su_27_Flankerseat':
                                child.material = materials[2];
                                break;
                            case 'Su_27__Su_27_Flankerpilot':
                                child.material = materials[3];
                                break;
                            default:
                                child.material = materials[0]; // 默认使用机身材质
                        }
                        child.castShadow = true;
                        child.receiveShadow = true;
                    }
                });
                // 调整模型位置和缩放
                object.position.set(0, 0, 0);
                object.scale.set(50, 50, 50);
                self.mScene.add(object);
                self.render();
            },
            function (progress) {
                console.log('加载进度:', (progress.loaded / progress.total) * 100 + '%');
            },
            function (error) {
                console.error('模型加载失败:', error);
            }
        );
    }

    loadSu35Model() {
        const self = this;
        // 1. 初始化 DDS 加载器（需引入 DDSLoader）
        const ddsLoader = new THREE.DDSLoader();

        // 2. 创建材质数组（与 .mtl 中的 3 个材质定义对应）
        const materials = [
            // 材质 1: 99eb5b51_dds (texture_0001.dds)
            new THREE.MeshPhysicalMaterial({
                color: new THREE.Color(0x7f7f7f), // 对应 Kd 0.7, 0.7, 0.7
                metalness: 0.1,                  // 近似 Ks 0.1
                roughness: 0.8,                   // 根据 Ns 10 调整
                map: ddsLoader.load('./model/Fighters/Su-35-Flanker-E/textures/texture_0001.dds'), // 漫反射贴图
                alphaMap: ddsLoader.load('./model/Fighters/Su-35-Flanker-E/textures/texture_0001.dds'), // 透明通道（如有）
                envMap: this.mEnvMap              // 环境贴图（可选）
            }),

            // 材质 2: d38ddc56_dds (texture_0006.dds)
            new THREE.MeshPhysicalMaterial({
                color: new THREE.Color(0x7f7f7f),
                metalness: 0.1,
                roughness: 0.8,
                map: ddsLoader.load('./model/Fighters/Su-35-Flanker-E/textures/texture_0006.dds'),
                alphaMap: ddsLoader.load('./model/Fighters/Su-35-Flanker-E/textures/texture_0006.dds'),
                envMap: this.mEnvMap
            }),

            // 材质 3: 14a876ec_dds (texture_0008.dds)
            new THREE.MeshPhysicalMaterial({
                color: new THREE.Color(0x7f7f7f),
                metalness: 0.1,
                roughness: 0.8,
                map: ddsLoader.load('./model/Fighters/Su-35-Flanker-E/textures/texture_0008.dds'),
                alphaMap: ddsLoader.load('./model/Fighters/Su-35-Flanker-E/textures/texture_0008.dds'),
                envMap: this.mEnvMap
            })
        ];

        // 3. 加载 OBJ 模型并绑定材质
        const objLoader = new THREE.OBJLoader();
        objLoader.load(
            './model/Fighters/Su-35-Flanker-E/Su-35-Flanker-E.obj',
            function (object) {
                object.traverse(function (child) {
                    if (child.isMesh) {
                        console.log('loaded su35 obj mesh:' + child.material.name);
                        // 根据子网格的材质索引分配材质
                        child.material = materials[child.materialIndex || 0];
                        child.castShadow = true;
                        child.receiveShadow = true;
                    }
                });
                self.mScene.add(object);
                self.render();
            },
            function (progress) { /* 加载进度回调 */ },
            function (error) { console.error('OBJ 加载失败:', error); }
        );
    }

    loadXitaiModel() {
        const self = this;
        // load xilou FBX
        var xilouMaterials = [
            new THREE.MeshPhysicalMaterial({
                map: this.mTextureLoader.load('./model/Demos/PBR_XiLou/XiLou_m1_C.jpg'), 
                normalMap: this.mTextureLoader.load('./model/Demos/PBR_XiLou/XiLou_m1_N.jpg'),
                metalnessMap: this.mTextureLoader.load('./model/Demos/PBR_XiLou/XiLou_m1_Ao.jpg'),
                specularMap: this.mTextureLoader.load('./model/Demos/PBR_XiLou/XiLou_m1_S.tga')
            }), 
            new THREE.MeshPhysicalMaterial({
                map: this.mTextureLoader.load('./model/Demos/PBR_XiLou/XiLou_m3_C.jpg'), 
                normalMap: this.mTextureLoader.load('./model/Demos/PBR_XiLou/XiLou_m3_N.jpg'),
                metalnessMap: this.mTextureLoader.load('./model/Demos/PBR_XiLou/XiLou_m3_Ao.jpg'),
                specularMap: this.mTextureLoader.load('./model/Demos/PBR_XiLou/XiLou_m3_S.tga')
            }),
            null,
            new THREE.MeshPhysicalMaterial({
                map: this.mTextureLoader.load('./model/Demos/PBR_XiLou/XiLou_m2_C.jpg'), 
                normalMap: this.mTextureLoader.load('./model/Demos/PBR_XiLou/XiLou_m2_N.jpg'),
                metalnessMap: this.mTextureLoader.load('./model/Demos/PBR_XiLou/XiLou_m2_Ao.jpg'),
                specularMap: this.mTextureLoader.load('./model/Demos/PBR_XiLou/XiLou_m2_S.tga')
            })
        ];

        var xilouLoader = new THREE.FBXLoader();
        xilouLoader.setCrossOrigin("Anonymous");
        xilouLoader.load("./model/Demos/PBR_XiLou/XiLou.fbx", function(object) {
            object.traverse(function(child) {
                if (child.isMesh) {    //  instanceof THREE.Mesh
                    console.log('loaded xilou obj mesh:' + child.material.name);
                    child.material = xilouMaterials;
                    child.castShadow = true;
                    child.receiveShadow = true; // 接收阴影
                }
            });
            object.scale.set(0.1, 0.1, 0.1)
            object.rotateY(-Math.PI / 2);

            self.mScene.add(object);

            self.render();
        })
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
}

export {Asenal};