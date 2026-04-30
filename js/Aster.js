function Aster(scene, config, endCallback) {
    this.mScene = scene;
    this.mRadius = config.radius;
    this.mLoader = new THREE.TextureLoader();
    this.mType = config.type;
    this.mLightSprite = undefined;
    this.mPointLight = undefined;
    this.mSunSurfaceMaterial = undefined;
    this.mSunCorona = undefined;
    this.mClock = undefined;
    this.mFirst = false;

    if (this.mType == AsterType.STAR) {
        var radius = config.radius;

        // -----------------------------------------------------------------
        // 太阳表面：贴图 + fbm UV 扰动（与 SolarSystem.js createSun 同一套）
        // -----------------------------------------------------------------
        var sunTex = this.mLoader.load(config.texPath);
        sunTex.wrapS = sunTex.wrapT = THREE.RepeatWrapping;

        var sunSurfaceVS = [
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
            "float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }",
            "float noise(vec2 p){",
            "  vec2 i = floor(p); vec2 f = fract(p);",
            "  float a = hash(i); float b = hash(i + vec2(1.0,0.0));",
            "  float c = hash(i + vec2(0.0,1.0)); float d = hash(i + vec2(1.0,1.0));",
            "  vec2 u = f*f*(3.0-2.0*f);",
            "  return mix(a,b,u.x) + (c-a)*u.y*(1.0-u.x) + (d-b)*u.x*u.y;",
            "}",
            "float fbm(vec2 p){",
            "  float v=0.0; float a=0.5;",
            "  mat2 m = mat2(1.6,-1.2,1.2,1.6);",
            "  for(int i=0;i<4;i++){ v += a*noise(p); p = m*p; a *= 0.5; }",
            "  return v;",
            "}",
            "void main(){",
            "  vec2 p = vUv * 6.0;",
            "  float n1 = fbm(p + vec2(time*0.25, -time*0.18));",
            "  float n2 = fbm(p*1.8 + vec2(-time*0.12, time*0.22));",
            "  vec2 duv = vec2(n1-0.5, n2-0.5) * distortionStrength;",
            "  vec2 uv = vUv + duv;",
            "  vec3 base = texture2D(map, uv).rgb;",
            "  float hot = smoothstep(0.35, 0.95, n1);",
            "  vec3 ramp = mix(vec3(1.0,0.55,0.08), vec3(1.0,0.92,0.55), hot);",
            "  vec3 c = base*0.65 + ramp*0.65;",
            "  vec3 viewN = normalize(vNormal);",
            "  float ndv = clamp(dot(viewN, vec3(0.0,0.0,1.0))*0.5+0.5, 0.0, 1.0);",
            "  float glow = pow(1.0-ndv, 2.0);",
            "  c += glow * vec3(1.0,0.65,0.2) * 0.35;",
            "  c *= emissiveStrength;",
            "  gl_FragColor = vec4(c, 1.0);",
            "}"
        ].join("\n");

        this.mSunSurfaceMaterial = new THREE.ShaderMaterial({
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
        this.mMeshMaterial = this.mSunSurfaceMaterial;

        // -----------------------------------------------------------------
        // 日冕：内/外两层球壳，AdditiveBlending，Fresnel rim + fbm 火焰
        // -----------------------------------------------------------------
        var coronaVS = [
            "uniform float time;",
            "uniform float displacementScale;",
            "varying vec3 vNormal;",
            "varying vec3 vViewPos;",
            "varying vec3 vModelDir;",
            "void main(){",
            "  vModelDir = normalize(position);",
            "  vNormal = normalize(normalMatrix * normal);",
            "  vec3 pos = position;",
            "  float bump = sin(pos.x*4.2+time*1.35)*cos(pos.y*3.7-time*0.95)*cos(pos.z*3.1+time*1.05);",
            "  pos = pos + normal*(0.14*bump*displacementScale);",
            "  vec4 mvPosition = modelViewMatrix * vec4(pos,1.0);",
            "  vViewPos = mvPosition.xyz;",
            "  gl_Position = projectionMatrix * mvPosition;",
            "}"
        ].join("\n");

        var coronaFS = [
            "uniform float time;",
            "uniform vec3 color;",
            "uniform float intensity;",
            "uniform float rimPower;",
            "uniform float flameScale;",
            "varying vec3 vNormal;",
            "varying vec3 vViewPos;",
            "varying vec3 vModelDir;",
            "float hash(vec2 p){ return fract(sin(dot(p, vec2(41.7,289.3)))*43758.5453); }",
            "float noise(vec2 p){",
            "  vec2 i=floor(p),f=fract(p);",
            "  float a=hash(i),b=hash(i+vec2(1.0,0.0)),c=hash(i+vec2(0.0,1.0)),d=hash(i+vec2(1.0,1.0));",
            "  vec2 u=f*f*(3.0-2.0*f);",
            "  return mix(a,b,u.x)+(c-a)*u.y*(1.0-u.x)+(d-b)*u.x*u.y;",
            "}",
            "float fbm(vec2 p){",
            "  float v=0.0,a=0.5;",
            "  for(int i=0;i<5;i++){ v+=a*noise(p); p*=2.02; a*=0.5; }",
            "  return v;",
            "}",
            "void main(){",
            "  vec3 viewDir = normalize(-vViewPos);",
            "  float NdotV = clamp(dot(normalize(vNormal),viewDir),0.001,1.0);",
            "  float rim = pow(1.0-NdotV, rimPower);",
            "  vec3 r = normalize(vModelDir);",
            "  float phi = atan(r.z, r.x);",
            "  float theta = acos(clamp(r.y,-1.0,1.0));",
            "  vec2 uv = vec2(phi,theta)*flameScale*vec2(3.0,5.5);",
            "  uv += vec2(time*0.55,-time*1.25);",
            "  float f1 = fbm(uv);",
            "  float f2 = fbm(uv*2.6+vec2(-time*0.35,time*0.65));",
            "  float flame = clamp(f1*0.62+f2*0.48,0.0,1.0);",
            "  flame = pow(flame,0.82);",
            "  float flicker = 0.88+0.12*sin(time*2.1+phi*3.0);",
            "  float alpha = rim*(0.12+0.92*flame)*flicker*intensity;",
            "  vec3 hot = mix(color,vec3(1.0,0.92,0.55),flame*0.55);",
            "  vec3 rgb = hot*(0.45+0.85*flame+0.35*rim);",
            "  gl_FragColor = vec4(rgb, clamp(alpha,0.0,1.0));",
            "}"
        ].join("\n");

        function makeCoronaMesh(r, uniforms, renderOrder) {
            var mat = new THREE.ShaderMaterial({
                uniforms: uniforms,
                vertexShader: coronaVS,
                fragmentShader: coronaFS,
                transparent: true,
                blending: THREE.AdditiveBlending,
                depthWrite: false,
                depthTest: true,
                side: THREE.FrontSide,
                polygonOffset: true,
                polygonOffsetFactor: -1,
                polygonOffsetUnits: -1
            });
            var mesh = new THREE.Mesh(new THREE.SphereGeometry(r, 64, 64), mat);
            mesh.renderOrder = renderOrder;
            return mesh;
        }

        var coronaInner = makeCoronaMesh(radius * 1.05, {
            time: { value: 0.0 },
            color: { value: new THREE.Color(0xff9933) },
            intensity: { value: 1.15 },
            rimPower: { value: 5.2 },
            flameScale: { value: 1.05 },
            displacementScale: { value: 1.0 }
        }, 1);

        var coronaOuter = makeCoronaMesh(radius * 1.28, {
            time: { value: 0.0 },
            color: { value: new THREE.Color(0xffcc66) },
            intensity: { value: 0.42 },
            rimPower: { value: 4.0 },
            flameScale: { value: 0.72 },
            displacementScale: { value: 0.65 }
        }, 2);

        this.mSunCorona = new THREE.Group();
        this.mSunCorona.add(coronaInner);
        this.mSunCorona.add(coronaOuter);

        // Sprite 光晕（暖黄色，远观补光用）
        this.mLightSprite = new THREE.Sprite(new THREE.SpriteMaterial({
            map: new THREE.CanvasTexture(this.generateSprite("255, 210, 140")),
            blending: THREE.AdditiveBlending,
            transparent: true,
            depthWrite: false
        }));
        this.mLightSprite.scale.set(radius * 5.5, radius * 5.5, radius * 5.5);

        this.mPointLight = new THREE.PointLight(0xfff1cc, 1.35, 1500, 0.2);
        this.mClock = new THREE.Clock();
    } else {
        this.mMeshMaterial = new THREE.MeshLambertMaterial({map: this.mLoader.load(config.texPath)});
    }

    this.mMaterial = Physijs.createMaterial(this.mMeshMaterial,
        0.1, // low friction
        0.9  // high restitution
    );
    if (this.mType != AsterType.STAR) {
        this.mMaterial.map.wrapS = THREE.RepeatWrapping;
        this.mMaterial.map.repeat.set(1.0, 1.0);
    }
    this.mGeometry = new THREE.SphereGeometry(config.radius, 32, 32);
    this.mMesh = new Physijs.SphereMesh(
        this.mGeometry,
        this.mMaterial,
        mass = config.mass
    );
    this.mMesh.name = this.mType;
    this.mMesh.position.set(config.pos.x, config.pos.y, config.pos.z);
    this.mMesh.radius = config.radius;
    this.mMesh.addEventListener('collision', function(otherObject, relativeVelocity, relativeRotation, contactNormal) {
        console.log('Stars collision happens, current type is :' + this.name + ', otherObject type is ' + otherObject.name);
        if (this.name != otherObject.name) {
            endCallback(DisasterType.STAR_EAT_EARTH);
        } else if (this.name == otherObject.name && this.name == '0') {
            endCallback(DisasterType.STAR_COLLISION);
        }
    });

    // 日冕挂在物理网格下，随恒星位移同步移动
    if (this.mSunCorona) {
        this.mMesh.add(this.mSunCorona);
    }

    // assist
    this.mTrack = new THREE.Geometry();
    this.mTrackLineMaterial = new THREE.LineBasicMaterial({color: config.trackColor, linewidth: 5});
    this.mTrackLine = new THREE.Line(this.mTrack, this.mTrackLineMaterial);
}

Aster.prototype.gravityForce = function(asters, debug = false) {
    var force = new THREE.Vector3(0, 0, 0)
    for (var i = 0; i < asters.length; i++) {
        aster = asters[i]
        if (aster == this) {continue}
        var distance = this.mMesh.position.distanceTo(aster.mMesh.position);
        // 万有引力公式
        var oneForce = aster.mMesh.position.clone().sub(this.mMesh.position).normalize()
                    .multiplyScalar(mUniverse.G)
                    .multiplyScalar(aster.mMesh.mass)
                    .multiplyScalar(this.mMesh.mass)
                    .divideScalar(Math.pow(distance,2));
        force.add(oneForce);

        if (debug) {
            console.log("oneForce:" + this.logVector3(oneForce));
            console.log("force:" + this.logVector3(force));
        }
    }
    if (debug) {
        console.log("all force:" + this.logVector3(force));
        console.log("position:" + this.logVector3(this.mMesh.position));
    }
    this.mMesh.applyForce(force, new THREE.Vector3(0,0,0));
}

Aster.prototype.logVector3 = function(vector) {
	return "vec[x] = " + vector.x + ", vec[y] = " + vector.y + ", vec[z] = " + vector.z;
}

Aster.prototype.showTrack = function() {
    if (this.mTrack.vertices.length > 100) {
        this.mTrack.vertices.pop(); // 尾部删除
    }
    this.mTrack.vertices.unshift(this.mMesh.position.clone());  // THREE.Vector3,头部添加
    this.mTrack.verticesNeedUpdate = true;
    if (!this.mFirst) {
        this.mScene.addElement(this.mTrackLine);
        this.mFirst = true;
    }
}

Aster.prototype.update = function(debug) {
    this.gravityForce(mUniverse.mObjects, debug);
    if (undefined != this.mPointLight)
        this.mPointLight.position.copy(this.mMesh.position);
    if (undefined != this.mLightSprite)
        this.mLightSprite.position.copy(this.mMesh.position);
    // 驱动恒星 Shader 的 time uniform
    if (this.mClock) {
        var t = this.mClock.getElapsedTime();
        if (this.mSunSurfaceMaterial && this.mSunSurfaceMaterial.uniforms) {
            this.mSunSurfaceMaterial.uniforms.time.value = t;
        }
        if (this.mSunCorona) {
            this.mSunCorona.traverse(function(obj) {
                if (obj.material && obj.material.uniforms && obj.material.uniforms.time) {
                    obj.material.uniforms.time.value = t;
                }
            });
        }
        // Sprite 随时间轻微脉动
        if (this.mLightSprite) {
            var s = this.mRadius * 5.5 * (0.95 + 0.06 * Math.sin(t * 1.7));
            this.mLightSprite.scale.set(s, s, s);
        }
    }
    this.showTrack();
}

/**
 * 实现球体发光
 * @param color 颜色的r,g和b值,比如："123,123,123";
 * @returns {Element} 返回canvas对象
 */
Aster.prototype.generateSprite = function (color) {
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
