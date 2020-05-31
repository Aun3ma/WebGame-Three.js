import * as THREE from "./node_modules/three/build/three.module.js";
import { FBXLoader } from "./node_modules/three/examples/jsm/loaders/FBXLoader.js";
import { OrbitControls } from "./node_modules/three/examples/jsm/controls/OrbitControls.js"
import Stats from "./node_modules/three/examples/jsm/libs/stats.module.js";
import { TWEEN } from "./node_modules/three/examples/jsm/libs/tween.module.min.js";
import { CSS2DRenderer, CSS2DObject } from './node_modules/three/examples/jsm/renderers/CSS2DRenderer.js';


function init() {
    //初始化fps视窗
    const stats = initStats(0);

    //创建场景、相机和时钟
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);
    const clock = new THREE.Clock();

    //创建WebGL渲染器
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setClearColor(new THREE.Color(0x000000));
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.shadowMap.enabled = true;
    document.getElementById("webgl-output").appendChild(renderer.domElement);

    //创建CSS2D渲染器
    const labelRenderer = new CSS2DRenderer();
    labelRenderer.setSize( window.innerWidth, window.innerHeight );
    labelRenderer.domElement.style.position = 'absolute';
    labelRenderer.domElement.style.top = '0px';
    document.getElementById("webgl-output").appendChild(labelRenderer.domElement);

    //设置相机位置
    camera.position.set(0, 70, 0);
    scene.add(camera);

    //创建开始页面
    const startLabelContainer = new THREE.Object3D();
    startLabelContainer.position.set(0, 55, 0);
    scene.add(startLabelContainer);
    camera.lookAt(startLabelContainer.position);
    const startLabelDiv = document.createElement('div');
    startLabelDiv.className = 'label';
    startLabelDiv.textContent = "Click to Start!";
    startLabelDiv.style.marginTop = '-1em';
    const startLabel = new CSS2DObject(startLabelDiv);
    startLabelContainer.add(startLabel);
    startLabel.position.set(0, 0, 0);

    labelRenderer.render(scene, camera);
    renderer.render(scene, camera);

    //点击开始游戏，加载场景
    window.addEventListener("click", clickStart);

    function clickStart(){
        window.removeEventListener("click", clickStart, false);
        startLabelDiv.textContent = "Now Loading...";
        Start();
    }

    //主角动画
    let mixer;
    let clipAction;
    let clipAction_2;

    //NPC动画
    let mixer_NPC_1;
    let mixer_NPC_2;
    let mixer_NPC_3;
    let clipAction_NPC_1;
    let clipAction_NPC_2;
    let clipAction_NPC_3;

    //标识当前正在播放的动画,1为Idle,2为Move
    let currentAnim = 1;

    //标识昼夜,1为白天,0为夜晚
    let currentTime = 0;

    //缓动动画
    // let tween_interactionLabel;
    // let tween_object;
    // let tween_camera;

    //用到的模型对象
    let myTotalMap
    let lead;
    let NPC_1;
    let NPC_2;
    let NPC_3;

    //初始面向z轴负方向 按顺时针方向置为1,2,3,4
    let direction = 1;

    //所有的路灯的点光源集合
    let lampLightArray = [];

    //标识点光源是否在运动
    let isTimeAnimationPlaying = 0;

    let isMusicPlaying = 0;

    //环境控制器
    let controls;

    //光线投射,用于交互元素
    let rayCaster = new THREE.Raycaster();
    let mouse = new THREE.Vector2();
    let targetObjects = [];

    //两个fbx模型加载器
    const fbx_loader = new FBXLoader();
    const sub_fbx_loader = new FBXLoader();

    //创建小游戏平面
    const smallGamePlaneGeometry = new THREE.PlaneBufferGeometry(60, 60);
    const smallGamePlane = new THREE.Mesh(smallGamePlaneGeometry,
        new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide }));
    smallGamePlane.rotation.x = -Math.PI / 2;
    const smallGamePlaneGrid = new THREE.GridHelper(60, 20)
    smallGamePlaneGrid.rotateX(-Math.PI / 2);
    smallGamePlane.add(smallGamePlaneGrid);
    smallGamePlane.position.set(0, 150, 0);
    scene.add(smallGamePlane);

    //添加积分板
    let myScore = 0;
    const scoreLabelDiv = document.createElement('div');
    scoreLabelDiv.className = 'label';
    scoreLabelDiv.textContent = "SCORE:" + myScore;
    scoreLabelDiv.style.marginTop = '-1em';

    const scoreLabel = new CSS2DObject(scoreLabelDiv);
    smallGamePlane.add(scoreLabel);
    scoreLabel.position.set(30, 30, 2)

    //加载小游戏金币模型
    const goldGeometry = new THREE.CylinderGeometry(1, 1, 0.2, 32);
    const goldMaterial = new THREE.MeshBasicMaterial({color: 0xffd82f});
    const goldCylinder = new THREE.Mesh(goldGeometry, goldMaterial);
    goldCylinder.position.set(Math.random() * 50 - 25, Math.random() * 50 - 25, 1.8);
    smallGamePlane.add(goldCylinder);
    let moveDirection = 0;

    let isSmallGamePlaying = false;

    function Start() {
        //添加网页缩放侦听事件
        window.addEventListener( 'resize', onWindowResize, false );

        //创建天空盒
        const textureLoader = new THREE.TextureLoader();
        const skyBoxTexture = textureLoader.load("./models/Texture/skyTexture.jpg");
        const skyBoxMeshMaterial = new THREE.MeshBasicMaterial({ map: skyBoxTexture, side: THREE.DoubleSide })
        // const skyBoxMeshMaterial_night = new THREE.MeshBasicMaterial({ map: skyBoxTexture_night, side: THREE.DoubleSide })
        const skyBox = new THREE.SphereGeometry(300, 32, 32);
        const skyBoxMesh = new THREE.Mesh(skyBox, skyBoxMeshMaterial);
        scene.add(skyBoxMesh);

        //创建轨道控制器，用于镜头移动
        let orbitControls = new OrbitControls(camera, document.getElementById("webgl-output"));
        orbitControls.autoRotate = false;

        //创建点光源，主光源
        const light_ = new THREE.PointLight(0xffffff, 1, 100);
        light_.position.set(0, 200, 0);
        light_.castShadow = true;
        light_.decay = 0;
        light_.power = 30.0
        scene.add(light_);

        //创建环境光
        const ambientColor = "#4c4c4c";
        const ambientLight = new THREE.AmbientLight(ambientColor);
        scene.add(ambientLight);

        //创建平行光，辅助光源
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.1);
        scene.add(directionalLight);

        //点光源运动轨道,模拟昼夜交替
        const pointLightOrbit = new THREE.EllipseCurve(0, 0, 250, 250, 0, 2 * Math.PI, false, 0);
        const orbitPoints = pointLightOrbit.getPoints(100);

        //生成时间序列
        let arr = []
        for (let i = 0; i < 101; i++) {
            arr.push(i);
        }
        const times = new Float32Array(arr);

        //生成位置序列
        let posArr = []
        orbitPoints.forEach(elem => {
            posArr.push(elem.x, elem.y, 0)
        });
        const values = new Float32Array(posArr);

        //创建点光源运动帧动画
        const pointLightPosTrack = new THREE.KeyframeTrack('.position', times, values);
        let pointLightDuration = 101;
        let pointLightClip = new THREE.AnimationClip("default", pointLightDuration, [pointLightPosTrack]);
        const mixer_pointLight = new THREE.AnimationMixer(light_);
        let pointLightAnimationAction = mixer_pointLight.clipAction(pointLightClip);
        pointLightAnimationAction.timeScale = 1;

        //加载地图模型
        fbx_loader.load("./models/Map_1.fbx", function(object) {
            object.name = "myTotalMap";
            object.scale.multiplyScalar(.1);
            scene.add(object);
            myTotalMap = object;

            //处理地图模型
            handleMap();
            //其他加载和配置操作
            afterMapLoad();
        }, THREE.ObjectLoader.onProgress, THREE.ObjectLoader.onError);

        function afterMapLoad(){
            // scene.fog = new THREE.FogExp2(0xffffff, 0.01);
            // console.log(myTotalMap);

            //加载主角人物模型和静止动画
            fbx_loader.load("./models/Lead/Idle.fbx", function(object) {
                object.name = "myLead";
                object.rotateY(Math.PI);
                object.scale.multiplyScalar(.03);
                object.position.set(60, 1, 20);
                lead = object;
                scene.add(object);

                // camera.lookAt(object.position);

                //添加人物静止动画
                mixer = new THREE.AnimationMixer(object);
                let animationClip = object.animations[0];
                clipAction = mixer.clipAction(animationClip);
                clipAction.play();


                //加载任务移动动画
                fbx_loader.load("./models/Lead/WalkingWithOutSkin.fbx", function(object) {
                    let animationClip_Walk = object.animations[0];
                    clipAction_2 = mixer.clipAction(animationClip_Walk);

                    //添加人物移动时间侦听
                    window.addEventListener("keydown", function (e) {
                        if (e.code === "KeyW"){
                            moveW(lead, camera);
                        }
                        if (e.code === "KeyS"){
                            moveS(lead, camera);
                        }
                        if (e.code === "KeyA"){
                            moveA(lead, camera);
                        }
                        if (e.code === "KeyD"){
                            moveD(lead, camera);
                        }
                    });
                    window.addEventListener("keyup", function (e) {
                        clipAction.play();
                        clipAction_2.stop();
                        currentAnim = 1;
                    })


                    //配置环境控制器
                    controls = new function () {
                        this.needTimeChange = false;
                        this.needMusic = false;
                        this.playSmallGame = function () {
                            if (isSmallGamePlaying){
                                isSmallGamePlaying = false;
                                scene.remove(smallGamePlane);
                                smallGamePlane.remove(scoreLabel);
                                scene.add(myTotalMap);
                                scene.add(NPC_1);
                                scene.add(NPC_2);
                                scene.add(NPC_3);
                                camera.position.set(60, 25, 45);
                                lead.position.set(60, 1, 20);
                            }
                            else {
                                isSmallGamePlaying = true;
                                scene.remove(myTotalMap);
                                scene.remove(NPC_1);
                                scene.remove(NPC_2);
                                scene.remove(NPC_3);
                                scene.add(smallGamePlane);
                                smallGamePlane.add(scoreLabel);
                                camera.position.set(0, 175, 25);
                                lead.position.set(0, 150, 0);
                            }
                        }
                    };
                    const gui = new dat.GUI();
                    const needTimeChangeController = gui.add(controls, "needTimeChange");
                    const needMusicController = gui.add(controls, "needMusic");
                    gui.add(controls, "playSmallGame");
                    needTimeChangeController.onChange(function(value) {
                        console.log("onChange:" + value)
                    });
                    needMusicController.onChange(function(value) {
                        console.log("onChange:" + value)
                    });

                    //添加场景互动元素
                    window.addEventListener("click", onMouseClick, false);

                    camera.position.set(60, 25, 45);

                    setTimeout(function () {
                        startLabelContainer.remove(startLabel);
                        scene.remove(startLabelContainer);
                        render();
                    }, 2000);

                }, THREE.ObjectLoader.onProgress, THREE.ObjectLoader.onError);


            }, THREE.ObjectLoader.onProgress, THREE.ObjectLoader.onError);
        }

        function render() {
            let delta = clock.getDelta();
            stats.update();
            orbitControls.update();
            // TWEEN.update();

            if (isSmallGamePlaying){
                goldAnimation();
                getDistance();
            }
            else {
                myScore = 0;
                scoreLabelDiv.textContent = "SCORE:" + myScore;
            }

            // camera.lookAt(lead.position);
            orbitControls.target = lead.position;

            //根据设置进行环境调整
            if (controls.needTimeChange){
                timeChange();
            }
            else {
                isTimeAnimationPlaying = 0;
                pointLightAnimationAction.stop();
                currentTime = 1;
                turnOffLights();
                skyBoxMesh.material.opacity = 0;
            }

            if (controls.needMusic && (isMusicPlaying === 0)){
                isMusicPlaying = 1;
                document.getElementById("myAudio").volume = 0.02;
                document.getElementById("myAudio").play();
            }
            else if((controls.needMusic === false) && (isMusicPlaying === 1)) {
                isMusicPlaying = 0;
                document.getElementById("myAudio").pause();
                document.getElementById("myAudio").currentTime = 0;
            }

            //动画渲染
            if (mixer && clipAction) {
                mixer.update(delta);
            }
            if (mixer_pointLight && pointLightAnimationAction){
                mixer_pointLight.update(delta);
            }
            if (mixer_NPC_1 && clipAction_NPC_1){
                mixer_NPC_1.update(delta);
            }
            if (mixer_NPC_2 && clipAction_NPC_2){
                mixer_NPC_2.update(delta);
            }
            if (mixer_NPC_3 && clipAction_NPC_3){
                mixer_NPC_3.update(delta);
            }

            labelRenderer.render(scene, camera);
            renderer.render(scene, camera);
            requestAnimationFrame(render);
        }

        function getDistance() {
            scene.updateMatrixWorld(true);
            let worldPosition_1 = new THREE.Vector3();
            let worldPosition_2 = new THREE.Vector3();
            goldCylinder.getWorldPosition(worldPosition_1);
            lead.getWorldPosition(worldPosition_2);
            let leadGoldDistance = worldPosition_1.distanceTo(worldPosition_2);
            console.log(leadGoldDistance);
            if (leadGoldDistance <= 2.4){
                myScore += 1;
                scoreLabelDiv.textContent = "SCORE:" + myScore;
                goldCylinder.position.set(Math.random() * 50 - 25, Math.random() * 50 - 25, 1.8);
            }
        }

        function goldAnimation() {
            //旋转
            goldCylinder.rotateZ(Math.PI / 180);

            //上下运动
            if (goldCylinder.position.z >= 2.2){
                moveDirection = 0;
            }
            if (goldCylinder.position.z <= 1.4){
                moveDirection = 1;
            }
            if (moveDirection === 0){
                goldCylinder.position.z -= 0.005;
            }
            if (moveDirection === 1) {
                goldCylinder.position.z += 0.005;
            }
        }

        function moveW(object, camera) {
            if (direction !== 1){
                clipAction_2.play();
                clipAction.stop();
                if (direction === 2){
                    object.rotateY(Math.PI / 2);
                }
                if (direction === 3){
                    object.rotateY(Math.PI);
                }
                if (direction === 4){
                    object.rotateY(-Math.PI / 2);
                }
                direction = 1;
            }

            if (currentAnim === 1){
                clipAction_2.play();
                clipAction.stop();
                currentAnim = 2;
            }

            // tween_camera = new TWEEN.Tween(camera.position);
            // tween_camera.to({ z: camera.position.z - 5 }, 866);
            // tween_camera.onComplete(function () {
            //     onTweenComplete();
            // })
            //
            // tween_object = new TWEEN.Tween(object.position);
            // tween_object.to({ z: object.position.z - 5 }, 866);
            // tween_object.onStart(function () {
            //     tween_camera.start();
            // });
            //
            //
            // clipAction_2.play();
            // clipAction.stop();
            //
            // tween_object.start();

            object.position.z -= 0.3;
            camera.position.z -= 0.3;
        }

        function moveS(object, camera) {
            if (direction !== 3){
                if (direction === 4){
                    object.rotateY(Math.PI / 2);
                }
                if (direction === 1){
                    object.rotateY(Math.PI);
                }
                if (direction === 2){
                    object.rotateY(-Math.PI / 2);
                }
                direction = 3;
            }

            if (currentAnim === 1){
                clipAction_2.play();
                clipAction.stop();
                currentAnim = 2;
            }

            object.position.z += 0.3;
            camera.position.z += 0.3;
        }

        function moveA(object, camera) {
            if (direction !== 4){
                if (direction === 1){
                    object.rotateY(Math.PI / 2);
                }
                if (direction === 2){
                    object.rotateY(Math.PI);
                }
                if (direction === 3){
                    object.rotateY(-Math.PI / 2);
                }
                direction = 4;
            }

            if (currentAnim === 1){
                clipAction_2.play();
                clipAction.stop();
                currentAnim = 2;
            }

            object.position.x -= 0.3;
            camera.position.x -= 0.3;
        }

        function moveD(object, camera) {
            if (direction !== 2){
                if (direction === 3){
                    object.rotateY(Math.PI / 2);
                }
                if (direction === 4){
                    object.rotateY(Math.PI);
                }
                if (direction === 1){
                    object.rotateY(-Math.PI / 2);
                }
                direction = 2;
            }

            if (currentAnim === 1){
                clipAction_2.play();
                clipAction.stop();
                currentAnim = 2;
            }

            object.position.x += 0.3;
            camera.position.x += 0.3;
        }

        // function onTweenComplete() {
        //     console.log("adada");
        //     clipAction.play();
        //     clipAction_2.stop();
        // }

        function handleMap() {
            //删除多余的动画模型
            myTotalMap.remove(myTotalMap.getObjectByName("Group_Animators"));

            const lampName = [
                "Lamp_2__3_", "Lamp__6_", "Lamp_2__2_", "Lamp_2__4_", "Lamp__3_", "Lamp__12_",
                "Lamp__4_", "Lamp__11_", "Lamp__8_", "Lamp_2__1_", "Lamp__2_", "Lamp",
                "Lamp_2__5_", "Lamp__5_", "Lamp_2", "Lamp__14_"
            ];
            const pointLightName = [
                "Point_light_2", "Point_light", "Point_light_1", "Point_light_3", "Point_light_4", "Point_light_5",
                "Point_light_6", "Point_light_7", "Point_light_8", "Point_light_9", "Point_light_10", "Point_light_11",
                "Point_light_14", "Point_light_12", "Point_light_13", "Point_light_16"
            ];
            const sphereName = [
                "Sphere_2", "Sphere", "Sphere_1", "Sphere_3", "Sphere_4", "Sphere_5",
                "Sphere_6", "Sphere_7", "Sphere_8", "Sphere_9", "Sphere_10", "Sphere_11",
                "Sphere_14", "Sphere_12", "Sphere_13", "Sphere_15"
            ];

            //处理路灯
            for (let y = 0; y < lampName.length; y++){
                let lamp = myTotalMap.getObjectByName(lampName[y]);

                lamp.remove(lamp.getObjectByName(pointLightName[y]));

                const sphere_2 = lamp.getObjectByName(sphereName[y]);
                sphere_2.material.opacity = 0.5;
                sphere_2.material.color = null;
                sphere_2.material.emissive = null;
                // sphere_2.material.emissive = new THREE.Color(5, 5, 5);

                let lampLight = new THREE.SpotLight(0xbbbbbb);
                lampLight.target = sphere_2;
                lampLight.angle = Math.PI / 4;
                lampLight.intensity = 5;
                sphere_2.add(lampLight);
                lampLightArray.push(lampLight);
            }

            turnOffLights();

            //添加NPC模型和动画
            addNPC();
        }

        function addNPC() {
            //加载npc动画模型
            sub_fbx_loader.load("./models/NPC/npc_1.fbx", function (npc_1) {
                npc_1.name = "myNPC_1";
                npc_1.rotateY(Math.PI / 3 * 2);
                npc_1.scale.multiplyScalar(.025);
                npc_1.position.set(14, 1, 40);
                NPC_1 = npc_1;
                scene.add(npc_1);

                //配置动画
                mixer_NPC_1 = new THREE.AnimationMixer(npc_1);
                let animationClip_NPC_1 = npc_1.animations[0];
                clipAction_NPC_1 = mixer_NPC_1.clipAction(animationClip_NPC_1);
                clipAction_NPC_1.play();

                targetObjects.push(npc_1);

            }, THREE.ObjectLoader.onProgress, THREE.ObjectLoader.onError);

            sub_fbx_loader.load("./models/NPC/npc_2.fbx", function (npc_2) {
                npc_2.name = "myNPC_2";
                npc_2.scale.multiplyScalar(.028);
                npc_2.position.set(62, 1, -11);
                NPC_2 = npc_2;
                scene.add(npc_2);

                //配置动画
                mixer_NPC_2 = new THREE.AnimationMixer(npc_2);
                let animationClip_NPC_2 = npc_2.animations[0];
                clipAction_NPC_2 = mixer_NPC_2.clipAction(animationClip_NPC_2);
                clipAction_NPC_2.play();

                targetObjects.push(npc_2);

            }, THREE.ObjectLoader.onProgress, THREE.ObjectLoader.onError);

            sub_fbx_loader.load("./models/NPC/npc_3.fbx", function (npc_3) {
                npc_3.name = "myNPC_3";
                npc_3.rotateY(Math.PI / 2);
                npc_3.scale.multiplyScalar(.014);
                npc_3.position.set(43, 1, 20);
                NPC_3 = npc_3;
                scene.add(npc_3);

                //配置动画
                mixer_NPC_3 = new THREE.AnimationMixer(npc_3);
                let animationClip_NPC_3 = npc_3.animations[0];
                clipAction_NPC_3 = mixer_NPC_3.clipAction(animationClip_NPC_3);
                clipAction_NPC_3.play();

                targetObjects.push(npc_3);

            }, THREE.ObjectLoader.onProgress, THREE.ObjectLoader.onError);
        }

        function turnOnLights() {
            for (let a = 0; a < lampLightArray.length; a++){
                lampLightArray[a].intensity = 5;
            }
        }

        function turnOffLights() {
            for (let b = 0; b < lampLightArray.length; b++){
                lampLightArray[b].intensity = 0;
            }
        }

        function timeChange() {
            if (isTimeAnimationPlaying === 0){
                pointLightAnimationAction.play();
                isTimeAnimationPlaying = 1;
            }
            if (currentTime === 0){
                if (light_.position.y > 40){
                    currentTime = 1;
                    turnOffLights();
                }
                if (skyBoxMesh.material.opacity > 0){
                    skyBoxMesh.material.opacity -= 0.05;
                    if (skyBoxMesh.material.opacity < 0){
                        skyBoxMesh.material.opacity = 0;
                    }
                }
            }
            else {
                if (light_.position.y < 40){
                    currentTime = 0;
                    turnOnLights();
                }
                if (skyBoxMesh.material.opacity < 1){
                    skyBoxMesh.material.opacity += 0.05;
                    if (skyBoxMesh.material.opacity > 1){
                        skyBoxMesh.material.opacity = 1;
                    }
                }
            }
        }

        function onMouseClick(event) {
            event.preventDefault();
            mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
            mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

            rayCaster.setFromCamera(mouse, camera);

            let intersects_1 = rayCaster.intersectObjects(targetObjects[0].children, true);
            let intersects_2 = rayCaster.intersectObjects(targetObjects[1].children, true);
            let intersects_3 = rayCaster.intersectObjects(targetObjects[2].children, true);

            if (intersects_1.length > 0){
                InteractionLabel("Hello Boss!", lead);
                setTimeout(function () {
                    InteractionLabel("Hello Amy!", NPC_1);
                }, 2000);
            }
            if (intersects_2.length > 0){
                InteractionLabel("Hello Boy!", lead);
                setTimeout(function () {
                    InteractionLabel("Hello Amy!", NPC_3);
                }, 2000);
            }
            if (intersects_3.length > 0){
                InteractionLabel("Hello Girl!", lead);
                setTimeout(function () {
                    InteractionLabel("Hello Amy!", NPC_2);
                }, 2000);
            }
        }

        function InteractionLabel(content, object) {
            const labelDiv = document.createElement('div');
            labelDiv.className = 'label';
            labelDiv.textContent = content;
            labelDiv.style.marginTop = '-1em';

            const interactionLabel = new CSS2DObject(labelDiv);
            object.add(interactionLabel);

            if (object === NPC_3){
                interactionLabel.position.set(0, 350, 0);
            }
            else {
                interactionLabel.position.set(0, 200, 0);
            }

            setTimeout(function () {
                object.remove(interactionLabel);
            }, 2000);
        }

        function onWindowResize() {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();

            renderer.setSize( window.innerWidth, window.innerHeight );

            renderer.render(scene, camera);
        }
    }

    function initStats(type) {
        const panelType = (typeof type !== 'undefined' && type) && (!isNaN(type)) ? parseInt(type) : 0;
        const stats = new Stats();

        stats.showPanel(panelType); // 0: fps, 1: ms, 2: mb, 3+: custom
        document.body.appendChild(stats.dom);

        return stats;
    }
}