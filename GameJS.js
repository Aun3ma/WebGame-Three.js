// 引入three.js库以及必要的插件和辅助工具
// three.js库、FBX模型加载工具、轨道控制器配置工具、性能指示器插件、Tween动画插件、CSS2D物体与渲染器
import * as THREE from "./node_modules/three/build/three.module.js";
import { FBXLoader } from "./node_modules/three/examples/jsm/loaders/FBXLoader.js";
import { OrbitControls } from "./node_modules/three/examples/jsm/controls/OrbitControls.js"
import Stats from "./node_modules/three/examples/jsm/libs/stats.module.js";
import { TWEEN } from "./node_modules/three/examples/jsm/libs/tween.module.min.js";
import { CSS2DRenderer, CSS2DObject } from './node_modules/three/examples/jsm/renderers/CSS2DRenderer.js';

// 平台载入与初始化
function init() {

    // 初始化fps视窗
    const stats = initStats(0);

    // 创建场景
    const scene = new THREE.Scene();

    // 创建相机
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);

    // 创建时钟
    const clock = new THREE.Clock();

    // 创建WebGL渲染器
    const renderer = new THREE.WebGLRenderer({ antialias: true });

    // 配置WebGL渲染器
    renderer.setClearColor(new THREE.Color(0x000000));
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.shadowMap.enabled = true;
    document.getElementById("webgl-output").appendChild(renderer.domElement);

    // 创建CSS2D渲染器
    const labelRenderer = new CSS2DRenderer();

    // 配置CSS2D渲染器
    labelRenderer.setSize( window.innerWidth, window.innerHeight );
    labelRenderer.domElement.style.position = 'absolute';
    labelRenderer.domElement.style.top = '0px';
    document.getElementById("webgl-output").appendChild(labelRenderer.domElement);

    // 设置相机位置
    camera.position.set(0, 70, 0);
    scene.add(camera);

    // 创建开始页面

    // 创建开始标签的容器
    const startLabelContainer = new THREE.Object3D();

    // 配置开始标签的容器
    startLabelContainer.position.set(0, 55, 0);
    scene.add(startLabelContainer);
    camera.lookAt(startLabelContainer.position);

    // 创建开始标签
    const startLabelDiv = document.createElement('div');

    // 配置开始标签
    startLabelDiv.className = 'label';
    startLabelDiv.textContent = "Click to Start!";
    startLabelDiv.style.marginTop = '-1em';

    // 根据标签创建CSS2DObject进行渲染
    const startLabel = new CSS2DObject(startLabelDiv);
    startLabelContainer.add(startLabel);
    startLabel.position.set(0, 0, 0);

    // 渲染场景，显示开始界面
    labelRenderer.render(scene, camera);
    renderer.render(scene, camera);

    // 添加点击事件
    // 点击开始游戏，加载场景
    window.addEventListener("click", clickStart);

    // 点击加载场景的方法
    function clickStart(){

        // 触发后移除该点击事件
        window.removeEventListener("click", clickStart, false);

        // 开始界面变为加载界面
        startLabelDiv.textContent = "Now Loading...";

        // 执行平台初始化、载入与配置
        Start();
    }

    // 一些用到的变量

    // 主角动画相关
    // 主角动画混合器
    let mixer;
    // 主角动画对象
    let animationClip_Idle_1;
    let animationClip_Run_1;
    let animationClip_Idle_2;
    let animationClip_Run_2;
    let animationClip_Idle_3;
    let animationClip_Run_3;
    // 主角动画_1
    let clipAction;
    // 主角动画_2
    let clipAction_2;
    // 标识当前正在播放的主角动画,1为Idle,2为Move
    let currentAnim = 1;
    // direction列表
    let directions = [1, 1, 1];
    // 初始面向z轴负方向 按顺时针方向置为1,2,3,4，主角移动方向
    let direction = 1;
    // 主角移动速度
    let moveSpeed = 0;

    // NPC动画相关
    // NPC动画混合器_1
    let mixer_NPC_1;
    // NPC动画混合器_2
    let mixer_NPC_2;
    // NPC动画混合器_3
    let mixer_NPC_3;
    // NPC动画_1
    let clipAction_NPC_1;
    // NPC动画_2
    let clipAction_NPC_2;
    // NPC动画_3
    let clipAction_NPC_3;

    // 环境相关
    // 标识昼夜,1为白天,0为夜晚
    let currentTime = 0;
    // 所有的路灯的点光源集合
    let lampLightArray = [];
    // 标识环境点光源是否在运动
    let isTimeAnimationPlaying = 0;
    // 标识环境音乐是否在播放
    let isMusicPlaying = 0;

    //缓动动画
    // let tween_interactionLabel;
    // let tween_object;
    // let tween_camera;

    // 模型对象相关
    // 地图模型
    let myTotalMap
    // 主角
    let lead;
    // 主角模型_1
    let Lead_1;
    // 主角模型_2
    let Lead_2;
    // 主角模型_3
    let Lead_3;
    // NPC模型_1
    let NPC_1;
    // NPC模型_2
    let NPC_2;
    // NPC模型_3
    let NPC_3;
    // 当前角色模型
    let currentModelId = 0;

    // 控制相关
    // 平台控制器
    let controls;

    // 交互相关
    // 光线投射,用于交互元素
    let rayCaster = new THREE.Raycaster();
    // 鼠标点击的二维坐标
    let mouse = new THREE.Vector2();
    // 接受光线投射的可交互对象集合
    let targetObjects = [];

    // 两个fbx模型加载器
    // 用于加载地图与主角模型和动画
    const fbx_loader = new FBXLoader();
    // 用于加载NPC模型和动画
    const sub_fbx_loader = new FBXLoader();

    // 小游戏1相关
    // 创建小游戏平面
    let smallGamePlaneGeometry;
    let smallGameMaterial;
    let smallGamePlane;
    // 创建平面网格
    // let smallGamePlaneGrid
    // scene.add(smallGamePlane);
    // 小游戏积分板
    let myScore;
    // 创建和配置积分标签容器
    let scoreLabelDiv;
    // 根据积分标签创建和配置CSS2D对象
    let scoreLabel;
    // 创建和配置时间标签容器
    let timeLabelDiv;
    // 根据时间标签创建和配置CSS2D对象
    let timeLabel;
    // smallGamePlane.add(scoreLabel);
    // 加载小游戏金币模型
    let goldGeometry;
    let goldMaterial;
    let goldCylinder;
    // 标识金币上下运动的方向
    let moveDirection;
    // 标识小游戏是否在进行
    let isSmallGamePlaying = false;

    // 小游戏2相关
    // 创建小游戏平面
    let smallGamePlaneGeometry_2;
    let smallGameMaterial_2;
    let smallGamePlane_2;
    // 创建平面网格
    // let smallGamePlaneGrid
    // scene.add(smallGamePlane);
    // 小游戏积分板
    let myScore_2;
    // 创建和配置积分标签容器
    let scoreLabelDiv_2;
    // 根据积分标签创建和配置CSS2D对象
    let scoreLabel_2;
    // 创建和配置时间标签容器
    let timeLabelDiv_2;
    // 根据时间标签创建和配置CSS2D对象
    let timeLabel_2;
    // smallGamePlane.add(scoreLabel);
    // 加载小游戏地鼠模型
    let aimGeometry_2;
    let aimMaterial_2;
    let aimCylinder_2;
    // 地鼠时间
    let aimTime = 0;
    // 地鼠位置
    let aimPosition = [];
    // 新位置
    let newAimPosition;
    // 旧位置
    let oldAimPosition;
    // 游戏难度
    let difficulty = 200;
    // 标识地鼠上下运动的方向
    let moveDirection_2;
    // 标识小游戏是否在进行
    let isSmallGamePlaying_2 = false;

    // 小游戏游戏时间
    let smallGamePlayTime = 60;

    // 主角与相机在主场景的位置
    let mainPosition;

    // 音乐音量
    let volume = 0.02;

    // 时间变化速度
    let timeSpeed = 1;

    function Start() {
        // 添加网页缩放事件，实现响应式
        window.addEventListener( 'resize', onWindowResize, false );

        // 加载与配置小游戏
        loadSmallGame();
        loadSmallGame_2();

        // 创建贴图加载工具实例
        const textureLoader = new THREE.TextureLoader();
        // 加载天空盒贴图
        const skyBoxTexture = textureLoader.load("./models/Texture/skyTexture.jpg");
        // 创建天空盒材质
        const skyBoxMeshMaterial = new THREE.MeshBasicMaterial({ map: skyBoxTexture, side: THREE.DoubleSide })
        // const skyBoxMeshMaterial_night = new THREE.MeshBasicMaterial({ map: skyBoxTexture_night, side: THREE.DoubleSide })
        // 创建天空盒容器
        const skyBox = new THREE.SphereGeometry(300, 32, 32);
        // 创建天空盒对象
        const skyBoxMesh = new THREE.Mesh(skyBox, skyBoxMeshMaterial);
        scene.add(skyBoxMesh);

        // 创建和配置轨道控制器，用于镜头移动
        let orbitControls = new OrbitControls(camera, document.getElementById("webgl-output"));
        orbitControls.enableDamping = true;
        orbitControls.autoRotate = false;

        // 创建点光源，主光源
        const light_ = new THREE.PointLight(0xffffff, 1, 100);
        // 配置主光源
        light_.position.set(0, 200, 0);
        light_.castShadow = true;
        light_.decay = 0;
        light_.power = 30.0
        scene.add(light_);

        // 创建与配置环境光
        const ambientColor = "#4c4c4c";
        const ambientLight = new THREE.AmbientLight(ambientColor);
        scene.add(ambientLight);

        // 创建与配置平行光，辅助光源
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.1);
        scene.add(directionalLight);

        // 模拟昼夜交替
        // 创建主光源运动轨道
        const pointLightOrbit = new THREE.EllipseCurve(0, 0, 250, 250, Math.PI / 4,
            2 * Math.PI + Math.PI / 4, false, 0);
        // 将轨道均分方便运动动画的制作
        const orbitPoints = pointLightOrbit.getPoints(100);
        // 生成动画帧时间序列
        let arr = []
        for (let i = 0; i < 101; i++) {
            arr.push(i);
        }
        const times = new Float32Array(arr);
        // 生成动画帧位置序列
        let posArr = []
        orbitPoints.forEach(elem => {
            posArr.push(elem.x, elem.y, 0)
        });
        const values = new Float32Array(posArr);
        // 创建与配置主光源运动帧动画
        const pointLightPosTrack = new THREE.KeyframeTrack('.position', times, values);
        let pointLightDuration = 101;
        let pointLightClip = new THREE.AnimationClip("default", pointLightDuration, [pointLightPosTrack]);
        const mixer_pointLight = new THREE.AnimationMixer(light_);
        let pointLightAnimationAction = mixer_pointLight.clipAction(pointLightClip);
        // 配置播放速度
        pointLightAnimationAction.timeScale = 1;

        // 加载地图模型
        fbx_loader.load("./models/Map_1.fbx", function(object) {

            // 标记并保存地图对象
            object.name = "myTotalMap";
            object.scale.multiplyScalar(.1);
            scene.add(object);
            myTotalMap = object;

            // 处理地图模型
            handleMap();

            // 其他加载和配置操作
            afterMapLoad();

        }, THREE.ObjectLoader.onProgress, THREE.ObjectLoader.onError);

        // 在地图加载完成后执行的操作
        function afterMapLoad(){
            // scene.fog = new THREE.FogExp2(0xffffff, 0.01);
            // console.log(myTotalMap);

            // 加载主角人物模型和静止动画
            fbx_loader.load("./models/Lead/Amy.fbx", function(object) {

                // 标记并保存主角对象
                // 配置主角对象
                object.rotateY(Math.PI);
                object.scale.multiplyScalar(.03);
                object.position.set(60, 1, 20);
                Lead_1 = object;
                lead = Lead_1;
                scene.add(object);

                // camera.lookAt(object.position);

                // 添加人物静止动画
                mixer = new THREE.AnimationMixer(object);
                animationClip_Idle_1 = object.animations[0];
                clipAction = mixer.clipAction(animationClip_Idle_1);
                clipAction.play();


                // 加载主角移动动画
                fbx_loader.load("./models/Lead/RunningWithOutSkin_1.fbx", function(object) {

                    // 保存人物移动动画
                    animationClip_Run_1 = object.animations[0];
                    clipAction_2 = mixer.clipAction(animationClip_Run_1);

                    // 加载备选模型
                    fbx_loader.load("./models/Lead/AJoe.fbx", function (object) {

                        object.rotateY(Math.PI);
                        object.scale.multiplyScalar(.024);
                        object.position.set(60, 1, 30);
                        Lead_2 = object;

                        // 加载备选模型动画
                        fbx_loader.load("./models/Lead/IdleWithOutSkin_2.fbx", function (object) {

                            // 保存动画
                            animationClip_Idle_2 = object.animations[0];
                        });

                        fbx_loader.load("./models/Lead/RunningWithOutSkin_2.fbx", function (object) {

                            // 保存动画
                            animationClip_Run_2 = object.animations[0];
                        });
                    });

                    fbx_loader.load("./models/Lead/Jasper.fbx", function (object) {

                        object.rotateY(Math.PI);
                        object.scale.multiplyScalar(.028);
                        object.position.set(60, 1, 10);
                        Lead_3 = object;

                        // 加载备选模型动画
                        fbx_loader.load("./models/Lead/IdleWithOutSkin_3.fbx", function (object) {

                            // 保存动画
                            animationClip_Idle_3 = object.animations[0];
                        });

                        fbx_loader.load("./models/Lead/RunningWithOutSkin_3.fbx", function (object) {

                            // 保存动画
                            animationClip_Run_3 = object.animations[0];
                        });
                    });

                    // 添加人物移动事件
                    window.addEventListener("keydown", function (e) {

                        // 按下W后的移动方式
                        if (e.code === "KeyW"){
                            moveW(lead);
                        }

                        // 按下S后的移动方式
                        if (e.code === "KeyS"){
                            moveS(lead);
                        }

                        // 按下A后的移动方式
                        if (e.code === "KeyA"){
                            moveA(lead);
                        }

                        // 按下D后的移动方式
                        if (e.code === "KeyD"){
                            moveD(lead);
                        }
                    });

                    // 添加键盘松开事件
                    window.addEventListener("keyup", function (e) {

                        //减少速度
                        moveSpeed = 0;
                        // 停止人物移动动画，播放人物静止动画
                        clipAction.play();
                        clipAction_2.stop();
                        // 更新currentAnim的值
                        currentAnim = 1;
                    })


                    // 配置环境控制器
                    controls = new function () {

                        // 是否开启昼夜变化
                        this.needTimeChange = false;

                        // 是否开启环境音乐
                        this.needMusic = false;

                        // 昼夜变化速度
                        this.timeChangeSpeed = 1;

                        // 音量
                        this.musicVolume = 50;

                        // 地鼠速度
                        this.gopherSpeed = 200;

                        // 返回平台
                        this.returnToMainScene = function () {

                            // 如果小游戏1正在进行，点击返回平台
                            if (isSmallGamePlaying){

                                // 更新isSmallGamePlaying
                                isSmallGamePlaying = false;
                                // 将相关小游戏内容从渲染的场景中移除
                                scene.remove(smallGamePlane);
                                smallGamePlane.remove(scoreLabel);
                                smallGamePlane.remove(timeLabel);
                                // 向渲染的场景中添加平台内容
                                scene.add(myTotalMap);
                                scene.add(NPC_1);
                                scene.add(NPC_2);
                                scene.add(NPC_3);
                                // 更新相机与主角位置
                                lead.position.set(mainPosition.x, mainPosition.y, mainPosition.z);
                                camera.position.set(mainPosition.x, mainPosition.y + 24, mainPosition.z + 25);
                            }

                            // 如果小游戏2正在进行，点击返回平台
                            if (isSmallGamePlaying_2){

                                // 更新isSmallGamePlaying_2
                                isSmallGamePlaying_2 = false;
                                // 将相关小游戏内容从渲染的场景中移除
                                scene.remove(smallGamePlane_2);
                                smallGamePlane_2.remove(scoreLabel_2);
                                smallGamePlane_2.remove(timeLabel_2);
                                // 向渲染的场景中添加平台内容
                                scene.add(myTotalMap);
                                scene.add(lead);
                                orbitControls.enabled = true;
                                scene.add(NPC_1);
                                scene.add(NPC_2);
                                scene.add(NPC_3);
                                // 更新相机与主角位置
                                lead.position.set(mainPosition.x, mainPosition.y, mainPosition.z);
                                camera.position.set(mainPosition.x, mainPosition.y + 24, mainPosition.z + 25);
                            }

                            // //如果小游戏不在进行，点击进入小游戏
                            // else {
                            //
                            //     // 更新isSmallGamePlaying
                            //     isSmallGamePlaying = true;
                            //     // 将平台内容从渲染的场景中移除
                            //     scene.remove(myTotalMap);
                            //     scene.remove(NPC_1);
                            //     scene.remove(NPC_2);
                            //     scene.remove(NPC_3);
                            //     // 将相关小游戏内容添加到渲染的场景中
                            //     scene.add(smallGamePlane);
                            //     smallGamePlane.add(scoreLabel);
                            //     // 更新相机与主角位置
                            //     camera.position.set(0, 175, 25);
                            //     lead.position.set(0, 150, 0);
                            // }
                        };

                        // 更换主角模型
                        this.model_1 = function () {

                            directions[currentModelId] = direction;
                            currentModelId = 0;
                            direction = directions[0];
                            let currentPosition = lead.position;
                            scene.remove(lead);
                            lead = Lead_1;
                            lead.position.set(currentPosition.x, currentPosition.y, currentPosition.z);
                            scene.add(lead);
                            mixer = new THREE.AnimationMixer(lead);
                            clipAction = mixer.clipAction(animationClip_Idle_1);
                            clipAction_2 = mixer.clipAction(animationClip_Run_1);
                            clipAction.play();
                        };
                        this.model_2 = function () {

                            directions[currentModelId] = direction;
                            currentModelId = 1;
                            direction = directions[1];
                            let currentPosition = lead.position;
                            scene.remove(lead);
                            lead = Lead_2;
                            lead.position.set(currentPosition.x, currentPosition.y, currentPosition.z);
                            scene.add(lead);
                            mixer = new THREE.AnimationMixer(lead);
                            clipAction = mixer.clipAction(animationClip_Idle_2);
                            clipAction_2 = mixer.clipAction(animationClip_Run_2);
                            clipAction.play();
                        };
                        this.model_3 = function () {

                            directions[currentModelId] = direction;
                            currentModelId = 2;
                            direction = directions[2];
                            let currentPosition = lead.position;
                            scene.remove(lead);
                            lead = Lead_3;
                            lead.position.set(currentPosition.x, currentPosition.y, currentPosition.z);
                            scene.add(lead);
                            mixer = new THREE.AnimationMixer(lead);
                            clipAction = mixer.clipAction(animationClip_Idle_3);
                            clipAction_2 = mixer.clipAction(animationClip_Run_3);
                            clipAction.play();
                        };

                        // 其他小游戏链接
                        this.momentsOfHappiness = function () {
                            window.open("https://moments.epic.net/","_blank");
                        };
                        this.brunoSimon = function () {
                            window.open("https://bruno-simon.com/","_blank");
                        };
                        this.shortTrip = function () {
                            window.open("https://alexanderperrin.com.au/paper/shorttrip/","_blank");
                        };
                    };

                    // 创建dat.GUI对象
                    const gui = new dat.GUI();

                    // 向GUI中添加控件
                    gui.add(controls, "returnToMainScene");

                    // 添加子菜单
                    const environmentSetting = gui.addFolder("environmentSetting");
                    const changeModel = gui.addFolder("changeModel");
                    const smallGameSetting = gui.addFolder("smallGameSetting");
                    const moreGames = gui.addFolder("moreGames");

                    // 向子菜单中添加控件
                    const needTimeChangeController = environmentSetting.add(controls, "needTimeChange");
                    const needMusicController = environmentSetting.add(controls, "needMusic");
                    const timeChangeSpeedController = environmentSetting.add(controls,
                        "timeChangeSpeed", 1.0, 5.0).step(0.1);
                    const musicVolumeController = environmentSetting.add(controls, "musicVolume", 0, 100).step(1);

                    changeModel.add(controls, "model_1");
                    changeModel.add(controls, "model_2");
                    changeModel.add(controls, "model_3");

                    const gopherSpeedController = smallGameSetting.add(controls, "gopherSpeed", 50, 350).step(5);

                    moreGames.add(controls, "momentsOfHappiness");
                    moreGames.add(controls, "brunoSimon");
                    moreGames.add(controls, "shortTrip");

                    gopherSpeedController.onFinishChange(function(value) {

                        difficulty = value;
                    });

                    timeChangeSpeedController.onFinishChange(function(value) {

                        timeSpeed = value;
                        pointLightAnimationAction.timeScale = timeSpeed;
                    });

                    musicVolumeController.onFinishChange(function(value) {

                        volume = value / 2500;
                        document.getElementById("myAudio").volume = volume;
                    });

                    // needTimeChange的方法
                    needTimeChangeController.onChange(function(value) {
                        console.log("onChange:" + value)
                    });

                    // needMusic的方法
                    needMusicController.onChange(function(value) {
                        console.log("onChange:" + value)
                    });

                    // 添加场景互动元素
                    window.addEventListener("click", onMouseClick, false);

                    // 设置相机位置
                    camera.position.set(60, 25, 45);

                    // 延迟渲染，保证所有模型完全加载和显示完毕
                    setTimeout(function () {

                        // 移除开始界面的文字标签
                        startLabelContainer.remove(startLabel);
                        scene.remove(startLabelContainer);

                        // 渲染场景以及一些帧操作
                        render();
                    }, 2000);

                    // 秒表
                    (function () {

                        setInterval(function () {

                            if (isSmallGamePlaying || isSmallGamePlaying_2){

                                smallGamePlayTime = smallGamePlayTime - 1;
                            }

                            if (!isSmallGamePlaying && !isSmallGamePlaying_2){

                                smallGamePlayTime = 60;
                            }
                        }, 1000);
                    })();

                }, THREE.ObjectLoader.onProgress, THREE.ObjectLoader.onError);


            }, THREE.ObjectLoader.onProgress, THREE.ObjectLoader.onError);


        }

        // 渲染方法
        function render() {

            // 获取时钟时间
            let delta = clock.getDelta();
            // 更新性能参数显示
            stats.update();

            // 天空盒旋转
            skyBoxMesh.rotateY(Math.PI / 30000)

            // 如果小游戏2正在进行，禁用轨道控制器
            if (!isSmallGamePlaying_2){
                // 更新轨道控制器
                orbitControls.update();
                // 更新轨道控制器的中心点，始终保持以主角为中心
                orbitControls.target = lead.position;
            }

            // TWEEN.update();
            if (smallGamePlayTime <= 0){

                if (isSmallGamePlaying){

                    // 更新isSmallGamePlaying
                    isSmallGamePlaying = false;
                    // 将相关小游戏内容从渲染的场景中移除
                    scene.remove(smallGamePlane);
                    smallGamePlane.remove(scoreLabel);
                    smallGamePlane.remove(timeLabel);
                    // 向渲染的场景中添加平台内容
                    scene.add(myTotalMap);
                    scene.add(NPC_1);
                    scene.add(NPC_2);
                    scene.add(NPC_3);
                    // 更新相机与主角位置
                    lead.position.set(mainPosition.x, mainPosition.y, mainPosition.z);
                    camera.position.set(mainPosition.x, mainPosition.y + 24, mainPosition.z + 25);
                }

                if (isSmallGamePlaying_2){

                    // 更新isSmallGamePlaying_2
                    isSmallGamePlaying_2 = false;
                    // 将相关小游戏内容从渲染的场景中移除
                    scene.remove(smallGamePlane_2);
                    smallGamePlane_2.remove(scoreLabel_2);
                    smallGamePlane_2.remove(timeLabel_2);
                    // 向渲染的场景中添加平台内容
                    scene.add(myTotalMap);
                    scene.add(lead);
                    orbitControls.enabled = true;
                    scene.add(NPC_1);
                    scene.add(NPC_2);
                    scene.add(NPC_3);
                    // 更新相机与主角位置
                    lead.position.set(mainPosition.x, mainPosition.y, mainPosition.z);
                    camera.position.set(mainPosition.x, mainPosition.y + 24, mainPosition.z + 25);
                }
            }

            // 如果小游戏1正在进行，渲染小游戏内容
            if (isSmallGamePlaying){

                // 金币动画渲染
                goldAnimation();

                // 判断是否迟到金币，以及后续的操作
                getDistance();

                timeLabelDiv.textContent = "Rest Time:" + smallGamePlayTime;
            }
            // 否则初始化小游戏1
            else {

                myScore = 0;
                scoreLabelDiv.textContent = "Score:" + myScore;
                timeLabelDiv.textContent = "Rest Time:" + smallGamePlayTime;
            }

            // 如果小游戏2正在运行，渲染小游戏内容
            if (isSmallGamePlaying_2){

                // 地鼠动画渲染
                aimAnimation();

                timeLabelDiv_2.textContent = "Rest Time:" + smallGamePlayTime;

                aimTime = aimTime + 1;
                if (aimTime > difficulty){

                    newAimPosition = aimPosition[Math.floor(Math.random() * 12)];
                    while (newAimPosition === oldAimPosition){
                        newAimPosition = aimPosition[Math.floor(Math.random() * 12)];
                    }
                    oldAimPosition = newAimPosition;
                    smallGamePlane_2.remove(aimCylinder_2);
                    aimGeometry_2 = new THREE.SphereGeometry(newAimPosition.w, 32, 32);
                    aimCylinder_2 = new THREE.Mesh(aimGeometry_2, aimMaterial_2);
                    targetObjects[0] = aimCylinder_2;
                    aimCylinder_2.position.set(newAimPosition.x, newAimPosition.y, newAimPosition.z);
                    smallGamePlane_2.add(aimCylinder_2);
                    aimTime = 0;
                }
            }

            // 否则初始化小游戏2
            else {

                myScore_2 = 0;
                scoreLabelDiv_2.textContent = "Score:" + myScore_2;
                timeLabelDiv_2.textContent = "Rest Time:" + smallGamePlayTime;
            }

            // camera.lookAt(lead.position);

            // 根据设置进行环境调整，如果需要
            if (controls.needTimeChange){
                timeChange();
            }

            // 否则初始化各参数，关闭
            else {
                isTimeAnimationPlaying = 0;
                pointLightAnimationAction.stop();
                currentTime = 1;
                turnOffLights();
                skyBoxMesh.material.opacity = 0;
            }

            // 如果需要音乐
            if (controls.needMusic && (isMusicPlaying === 0)){

                // 播放
                isMusicPlaying = 1;
                document.getElementById("myAudio").volume = 0.02;
                document.getElementById("myAudio").play();
            }

            // 否则，关闭
            else if((controls.needMusic === false) && (isMusicPlaying === 1)) {

                // 关闭
                isMusicPlaying = 0;
                document.getElementById("myAudio").pause();
                document.getElementById("myAudio").currentTime = 0;
            }

            // 动画渲染
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

            // 角色移动
            if (direction === 1 && moveSpeed !== 0){
                lead.position.z -= moveSpeed;
                camera.position.z -= moveSpeed;
            }
            if (direction === 3 && moveSpeed !== 0){
                lead.position.z += moveSpeed;
                camera.position.z += moveSpeed;
            }
            if (direction === 4 && moveSpeed !== 0){
                lead.position.x -= moveSpeed;
                camera.position.x -= moveSpeed;
            }
            if (direction === 2 && moveSpeed !== 0){
                lead.position.x += moveSpeed;
                camera.position.x += moveSpeed;
            }

            // 场景渲染
            labelRenderer.render(scene, camera);
            renderer.render(scene, camera);
            requestAnimationFrame(render);
        }

        // 判断是否吃到金币
        function getDistance() {

            // 获取主角与金币的世界坐标
            scene.updateMatrixWorld(true);
            let worldPosition_1 = new THREE.Vector3();
            let worldPosition_2 = new THREE.Vector3();

            goldCylinder.getWorldPosition(worldPosition_1);
            lead.getWorldPosition(worldPosition_2);

            // 计算距离
            let leadGoldDistance = worldPosition_1.distanceTo(worldPosition_2);
            // 如果进入判定距离，吃掉金币
            if (leadGoldDistance <= 2.4){

                // 加分
                myScore += 1;
                scoreLabelDiv.textContent = "SCORE:" + myScore;

                // 重新设置金币位置
                goldCylinder.position.set(Math.random() * 50 - 25, Math.random() * 50 - 25, 1.8);
            }
        }

        // 加载与配置小游戏1
        function loadSmallGame() {

            // 创建小游戏平面
            smallGamePlaneGeometry = new THREE.PlaneBufferGeometry(60, 60);
            const smallGameTextureLoader = new THREE.TextureLoader();
            const smallGameTexture = smallGameTextureLoader.load("./models/Texture/grass.jpg");
            smallGameMaterial = new THREE.MeshBasicMaterial({ map: smallGameTexture, side: THREE.DoubleSide });
            smallGamePlane = new THREE.Mesh(smallGamePlaneGeometry, smallGameMaterial);
            smallGamePlane.rotation.x = -Math.PI / 2;
            // 创建平面网格
            // smallGamePlaneGrid = new THREE.GridHelper(60, 20)
            // 配置小游戏平面位置与方向
            // smallGamePlaneGrid.rotateX(-Math.PI / 2);
            // smallGamePlane.add(smallGamePlaneGrid);
            smallGamePlane.position.set(0, 150, 0);
            // scene.add(smallGamePlane);

            // 小游戏积分板
            myScore = 0;
            // 创建和配置积分标签容器
            scoreLabelDiv = document.createElement('div');
            scoreLabelDiv.className = 'label';
            scoreLabelDiv.textContent = "Score:" + myScore;
            scoreLabelDiv.style.marginTop = '-1em';
            // 创建和配置时间标签容器
            timeLabelDiv = document.createElement('div');
            timeLabelDiv.className = 'label';
            timeLabelDiv.textContent = "Rest Time:" + smallGamePlayTime;
            timeLabelDiv.style.marginTop = '-1em';

            // 根据积分标签创建和配置CSS2D对象
            scoreLabel = new CSS2DObject(scoreLabelDiv);
            // smallGamePlane.add(scoreLabel);
            scoreLabel.position.set(30, 30, 2);
            // 根据时间标签创建和配置CSS2D对象
            timeLabel = new CSS2DObject(timeLabelDiv);
            // smallGamePlane.add(scoreLabel);
            timeLabel.position.set(-30, 30, 2);

            // 加载小游戏金币模型
            goldGeometry = new THREE.CylinderGeometry(1, 1, 0.2, 32);
            goldMaterial = new THREE.MeshBasicMaterial({color: 0xffd82f});
            goldCylinder = new THREE.Mesh(goldGeometry, goldMaterial);
            // 配置金币的简单动画效果
            goldCylinder.position.set(Math.random() * 50 - 25, Math.random() * 50 - 25, 1.8);
            smallGamePlane.add(goldCylinder);
            // 标识金币上下运动的方向
            moveDirection = 0;
        }

        // 加载与配置小游戏2
        function loadSmallGame_2() {

            // 创建小游戏平面
            smallGamePlaneGeometry_2 = new THREE.PlaneBufferGeometry(40, 40);
            const smallGameTextureLoader_2 = new THREE.TextureLoader();
            const smallGameTexture_2 = smallGameTextureLoader_2.load("./models/Texture/background.jpg");
            smallGameMaterial_2 = new THREE.MeshBasicMaterial({ map: smallGameTexture_2, side: THREE.DoubleSide });
            smallGamePlane_2 = new THREE.Mesh(smallGamePlaneGeometry_2, smallGameMaterial_2);
            smallGamePlane_2.rotation.x = -Math.PI / 2;
            // 创建平面网格
            // smallGamePlaneGrid = new THREE.GridHelper(60, 20)
            // 配置小游戏平面位置与方向
            // smallGamePlaneGrid.rotateX(-Math.PI / 2);
            // smallGamePlane.add(smallGamePlaneGrid);
            smallGamePlane_2.position.set(0, 150, 0);
            // scene.add(smallGamePlane);

            // 小游戏积分板
            myScore_2 = 0;
            // 创建和配置积分标签容器
            scoreLabelDiv_2 = document.createElement('div');
            scoreLabelDiv_2.className = 'label';
            scoreLabelDiv_2.textContent = "Score:" + myScore_2;
            scoreLabelDiv_2.style.marginTop = '-1em';
            // 创建和配置时间标签容器
            timeLabelDiv_2 = document.createElement('div');
            timeLabelDiv_2.className = 'label';
            timeLabelDiv_2.textContent = "Rest Time:" + smallGamePlayTime;
            timeLabelDiv_2.style.marginTop = '-1em';

            // 根据积分标签创建和配置CSS2D对象
            scoreLabel_2 = new CSS2DObject(scoreLabelDiv_2);
            // smallGamePlane.add(scoreLabel);
            scoreLabel_2.position.set(20, 20, 2);
            // 根据时间标签创建和配置CSS2D对象
            timeLabel_2 = new CSS2DObject(timeLabelDiv_2);
            // smallGamePlane.add(scoreLabel);
            timeLabel_2.position.set(-20, 20, 2);

            // 地鼠位置
            aimPosition.push(new THREE.Vector4(10.6, 8.7, 1.8, 1.3));
            aimPosition.push(new THREE.Vector4(5.1, 8.8, 1.8, 1.3));
            aimPosition.push(new THREE.Vector4(-0.6, 8.5, 1.8, 1.3));
            aimPosition.push(new THREE.Vector4(-6.8, 8.8, 1.8, 1.3));
            aimPosition.push(new THREE.Vector4(-12.6, 8.5, 1.8, 1.3));
            aimPosition.push(new THREE.Vector4(-11.5, 1.2, 1.8, 1.7));
            aimPosition.push(new THREE.Vector4(-4.0, 1.2, 1.8, 1.7));
            aimPosition.push(new THREE.Vector4(4.0, 1.3, 1.8, 1.7));
            aimPosition.push(new THREE.Vector4(11.6, 1.3, 1.8, 1.7));
            aimPosition.push(new THREE.Vector4(9.5, -6.8, 1.8, 2.2));
            aimPosition.push(new THREE.Vector4(-0.5, -6.8, 1.8, 2.2));
            aimPosition.push(new THREE.Vector4(-9.8, -6.8, 1.8, 2.2));

            // 加载小游戏目标模型
            newAimPosition = aimPosition[Math.floor(Math.random() * 12)];
            oldAimPosition = newAimPosition;
            aimGeometry_2 = new THREE.SphereGeometry(newAimPosition.w, 32, 32);
            aimMaterial_2 = new THREE.MeshBasicMaterial({color: 0xffd82f});
            aimCylinder_2 = new THREE.Mesh(aimGeometry_2, aimMaterial_2);
            aimCylinder_2.position.set(newAimPosition.x, newAimPosition.y, newAimPosition.z);
            smallGamePlane_2.add(aimCylinder_2);

            // 地鼠时间
            aimTime = 0;

            // 标识地鼠上下运动的方向
            moveDirection_2 = 0;

            // 将地鼠添加到可交互列表中
            targetObjects.push(aimCylinder_2);
        }

        // 地鼠动画效果
        function aimAnimation() {

            // 旋转
            aimCylinder_2.rotateZ(Math.PI / 180);

            // 上下运动
            if (aimCylinder_2.position.z >= 2.2){
                moveDirection_2 = 0;
            }
            if (aimCylinder_2.position.z <= 1.4){
                moveDirection_2 = 1;
            }
            if (moveDirection_2 === 0){
                aimCylinder_2.position.z -= 0.005;
            }
            if (moveDirection_2 === 1) {
                aimCylinder_2.position.z += 0.005;
            }
        }

        // 金币动画效果
        function goldAnimation() {

            // 旋转
            goldCylinder.rotateZ(Math.PI / 180);

            // 上下运动
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

        // 主角移动控制相关
        // 按住W移动
        function moveW(object) {

            // 如果主角朝向不对
            if (direction !== 1){

                // 变更动画
                clipAction_2.play();
                clipAction.stop();

                // 根据不同的角色朝向，改变朝向
                if (direction === 2){
                    object.rotateY(Math.PI / 2);
                }
                if (direction === 3){
                    object.rotateY(Math.PI);
                }
                if (direction === 4){
                    object.rotateY(-Math.PI / 2);
                }

                // 更新direction
                direction = 1;
            }

            // 更新currentAnim和动画
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

            // 设置速度
            moveSpeed = 0.1;

            // // 移动角色和相机
            // object.position.z -= 0.3;
            // camera.position.z -= 0.3;
        }

        // 按住S移动
        function moveS(object) {

            // 如果角色朝向不对
            if (direction !== 3){

                // 根据不同的朝向，进行旋转
                if (direction === 4){
                    object.rotateY(Math.PI / 2);
                }
                if (direction === 1){
                    object.rotateY(Math.PI);
                }
                if (direction === 2){
                    object.rotateY(-Math.PI / 2);
                }

                // 更新direction
                direction = 3;
            }

            // 更新currentAnim和动画
            if (currentAnim === 1){
                clipAction_2.play();
                clipAction.stop();
                currentAnim = 2;
            }

            // 设置速度
            moveSpeed = 0.1;

            // // 移动角色和相机
            // object.position.z += 0.3;
            // camera.position.z += 0.3;
        }

        // 按住A移动
        function moveA(object) {

            // 如果角色朝向不对
            if (direction !== 4){

                // 根据不同的朝向，进行旋转
                if (direction === 1){
                    object.rotateY(Math.PI / 2);
                }
                if (direction === 2){
                    object.rotateY(Math.PI);
                }
                if (direction === 3){
                    object.rotateY(-Math.PI / 2);
                }

                // 更新direction
                direction = 4;
            }

            // 更新currentAnim和动画
            if (currentAnim === 1){
                clipAction_2.play();
                clipAction.stop();
                currentAnim = 2;
            }

            // 设置速度
            moveSpeed = 0.1;

            // // 移动角色和相机
            // object.position.x -= 0.3;
            // camera.position.x -= 0.3;
        }

        // 按住D移动
        function moveD(object) {

            // 如果角色朝向不对
            if (direction !== 2){

                // 根据不同的朝向，进行旋转
                if (direction === 3){
                    object.rotateY(Math.PI / 2);
                }
                if (direction === 4){
                    object.rotateY(Math.PI);
                }
                if (direction === 1){
                    object.rotateY(-Math.PI / 2);
                }

                // 更新direction
                direction = 2;
            }

            // 更新currentAnim和动画
            if (currentAnim === 1){
                clipAction_2.play();
                clipAction.stop();
                currentAnim = 2;
            }

            // 设置速度
            moveSpeed = 0.1;

            // // 移动角色和相机
            // object.position.x += 0.3;
            // camera.position.x += 0.3;
        }

        // function onTweenComplete() {
        //     console.log("adada");
        //     clipAction.play();
        //     clipAction_2.stop();
        // }

        // 处理地图模型的方法
        function handleMap() {

            // 删除多余的动画模型
            myTotalMap.remove(myTotalMap.getObjectByName("Group_Animators"));

            // 路灯模型集合
            const lampName = [
                "Lamp_2__3_", "Lamp__6_", "Lamp_2__2_", "Lamp_2__4_", "Lamp__3_", "Lamp__12_",
                "Lamp__4_", "Lamp__11_", "Lamp__8_", "Lamp_2__1_", "Lamp__2_", "Lamp",
                "Lamp_2__5_", "Lamp__5_", "Lamp_2", "Lamp__14_"
            ];

            // 路灯聚光灯集合
            const pointLightName = [
                "Point_light_2", "Point_light", "Point_light_1", "Point_light_3", "Point_light_4", "Point_light_5",
                "Point_light_6", "Point_light_7", "Point_light_8", "Point_light_9", "Point_light_10", "Point_light_11",
                "Point_light_14", "Point_light_12", "Point_light_13", "Point_light_16"
            ];

            // 路灯灯泡模型集合
            const sphereName = [
                "Sphere_2", "Sphere", "Sphere_1", "Sphere_3", "Sphere_4", "Sphere_5",
                "Sphere_6", "Sphere_7", "Sphere_8", "Sphere_9", "Sphere_10", "Sphere_11",
                "Sphere_14", "Sphere_12", "Sphere_13", "Sphere_15"
            ];

            // 处理路灯
            for (let y = 0; y < lampName.length; y++){

                // 获取路灯模型
                let lamp = myTotalMap.getObjectByName(lampName[y]);

                // 移除点光源
                lamp.remove(lamp.getObjectByName(pointLightName[y]));

                // 获取灯泡模型，并进行设置
                const sphere_2 = lamp.getObjectByName(sphereName[y]);
                sphere_2.material.opacity = 0.5;
                sphere_2.material.color = null;
                sphere_2.material.emissive = null;
                // sphere_2.material.emissive = new THREE.Color(5, 5, 5);

                // 创建并配置聚光灯
                let lampLight = new THREE.SpotLight(0xbbbbbb);
                lampLight.target = sphere_2;
                lampLight.angle = Math.PI / 4;
                lampLight.intensity = 5;

                // 将聚光灯添加到路灯模型，作为新光源
                sphere_2.add(lampLight);
                lampLightArray.push(lampLight);
            }

            // 关闭所有路灯
            turnOffLights();

            // 添加NPC模型和动画
            addNPC();
        }

        // 添加NPC的方法
        function addNPC() {

            //加载npc_1动画模型
            sub_fbx_loader.load("./models/NPC/npc_1.fbx", function (npc_1) {

                // 标记和保存NPC模型对象
                npc_1.name = "myNPC_1";
                // 配置NPC模型
                npc_1.rotateY(Math.PI / 3 * 2);
                npc_1.scale.multiplyScalar(.025);
                npc_1.position.set(14, 1, 40);
                NPC_1 = npc_1;
                scene.add(npc_1);

                // 配置动画
                mixer_NPC_1 = new THREE.AnimationMixer(npc_1);
                let animationClip_NPC_1 = npc_1.animations[0];
                clipAction_NPC_1 = mixer_NPC_1.clipAction(animationClip_NPC_1);
                clipAction_NPC_1.play();

                // 添加到可交互对象集合中
                targetObjects.push(npc_1);

            }, THREE.ObjectLoader.onProgress, THREE.ObjectLoader.onError);

            //加载npc_2动画模型
            sub_fbx_loader.load("./models/NPC/npc_2.fbx", function (npc_2) {

                // 标记和保存NPC模型对象
                npc_2.name = "myNPC_2";
                // 配置NPC模型
                npc_2.scale.multiplyScalar(.028);
                npc_2.position.set(62, 1, -11);
                NPC_2 = npc_2;
                scene.add(npc_2);

                // 配置动画
                mixer_NPC_2 = new THREE.AnimationMixer(npc_2);
                let animationClip_NPC_2 = npc_2.animations[0];
                clipAction_NPC_2 = mixer_NPC_2.clipAction(animationClip_NPC_2);
                clipAction_NPC_2.play();

                // 添加到可交互对象集合中
                targetObjects.push(npc_2);

            }, THREE.ObjectLoader.onProgress, THREE.ObjectLoader.onError);

            //加载npc_3动画模型
            sub_fbx_loader.load("./models/NPC/npc_3.fbx", function (npc_3) {

                // 标记和保存NPC模型对象
                npc_3.name = "myNPC_3";
                // 配置NPC模型
                npc_3.rotateY(Math.PI / 2);
                npc_3.scale.multiplyScalar(.014);
                npc_3.position.set(43, 1, 20);
                NPC_3 = npc_3;
                scene.add(npc_3);

                // 配置动画
                mixer_NPC_3 = new THREE.AnimationMixer(npc_3);
                let animationClip_NPC_3 = npc_3.animations[0];
                clipAction_NPC_3 = mixer_NPC_3.clipAction(animationClip_NPC_3);
                clipAction_NPC_3.play();

                // 添加到可交互对象集合中
                targetObjects.push(npc_3);

            }, THREE.ObjectLoader.onProgress, THREE.ObjectLoader.onError);
        }

        // 开路灯的方法
        function turnOnLights() {

            for (let a = 0; a < lampLightArray.length; a++){

                lampLightArray[a].intensity = 5;
            }
        }

        // 关路灯的方法
        function turnOffLights() {

            for (let b = 0; b < lampLightArray.length; b++){

                lampLightArray[b].intensity = 0;
            }
        }

        // 控制昼夜变化的方法
        function timeChange() {

            // 如果动画没播放
            if (isTimeAnimationPlaying === 0){

                // 播放动画并更新isTimeAnimationPlaying
                pointLightAnimationAction.play();
                isTimeAnimationPlaying = 1;
            }

            // 如果当前是夜晚
            if (currentTime === 0){

                // 当主光源上升到一定高度，关灯并调整时间为白天
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
            // 如果当前是白天
            else {

                // 当主光源下降到一定高度，开灯并调整时间为夜晚
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

        // 点击交互事件
        function onMouseClick(event) {

            event.preventDefault();
            // 获取鼠标点击的二维坐标
            mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
            mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

            // 发射光线
            rayCaster.setFromCamera(mouse, camera);

            // 获取光线穿过的可交互对象
            let intersects_1 = rayCaster.intersectObjects(targetObjects[1].children, true);
            let intersects_2 = rayCaster.intersectObjects(targetObjects[2].children, true);
            let intersects_3 = rayCaster.intersectObjects(targetObjects[3].children, true);
            let intersects_4 = rayCaster.intersectObject(targetObjects[0]);

            // 如果点到地鼠
            if (intersects_4.length > 0){

                // 时间置零
                aimTime = 0;
                // 加分
                myScore_2 += 1;
                scoreLabelDiv_2.textContent = "Score:" + myScore_2;

                // 重新设置地鼠位置
                newAimPosition = aimPosition[Math.floor(Math.random() * 12)];
                while (newAimPosition === oldAimPosition){
                    newAimPosition = aimPosition[Math.floor(Math.random() * 12)];
                }
                oldAimPosition = newAimPosition;
                smallGamePlane_2.remove(aimCylinder_2);
                aimGeometry_2 = new THREE.SphereGeometry(newAimPosition.w, 32, 32);
                aimCylinder_2 = new THREE.Mesh(aimGeometry_2, aimMaterial_2);
                targetObjects[0] = aimCylinder_2;
                aimCylinder_2.position.set(newAimPosition.x, newAimPosition.y, newAimPosition.z);
                smallGamePlane_2.add(aimCylinder_2);
            }

            // 如果有，则创建对话气泡
            if (intersects_1.length > 0){

                // 创建对话气泡
                InteractionLabel("Do you want to play a small game, Amy?", NPC_1);
                setTimeout(function () {
                    InteractionLabel("Sure!", lead);
                }, 2000);

                // 进入小游戏
                setTimeout(function () {
                    if (!isSmallGamePlaying){
                        // 进入小游戏
                        mainPosition = new THREE.Vector3(lead.position.x, lead.position.y, lead.position.z);
                        // 更新isSmallGamePlaying
                        isSmallGamePlaying = true;
                        // 将平台内容从渲染的场景中移除
                        scene.remove(myTotalMap);
                        scene.remove(NPC_1);
                        scene.remove(NPC_2);
                        scene.remove(NPC_3);
                        // 将相关小游戏内容添加到渲染的场景中
                        scene.add(smallGamePlane);
                        smallGamePlane.add(scoreLabel);
                        smallGamePlane.add(timeLabel);
                        // 更新相机与主角位置
                        camera.position.set(0, 175, 25);
                        lead.position.set(0, 150, 0);
                    }
                }, 4000);
            }

            if (intersects_2.length > 0){

                // 创建对话气泡
                InteractionLabel("Do you want to play a small game, Amy?", NPC_3);
                setTimeout(function () {
                    InteractionLabel("Sure!", lead);
                }, 2000);

                // 进入小游戏2
                setTimeout(function () {
                    if (!isSmallGamePlaying_2){
                        // 进入小游戏2
                        mainPosition = lead.position;
                        // 更新isSmallGamePlaying_2
                        isSmallGamePlaying_2 = true;
                        // 将平台内容从渲染的场景中移除
                        scene.remove(myTotalMap);
                        scene.remove(NPC_1);
                        scene.remove(NPC_2);
                        scene.remove(NPC_3);
                        // 将相关小游戏内容添加到渲染的场景中
                        scene.add(smallGamePlane_2);
                        smallGamePlane_2.add(scoreLabel_2);
                        smallGamePlane_2.add(timeLabel_2);
                        // 更新相机与主角位置
                        camera.position.set(0, 175, 22);
                        orbitControls.enabled = false;
                        camera.lookAt(smallGamePlane_2.position)
                        // lead.position.set(0, 150, 0);
                        scene.remove(lead);
                        // camera.lookAt(smallGamePlane_2);
                    }
                }, 4000);
            }

            if (intersects_3.length > 0){

                // 创建对话气泡
                InteractionLabel("Hello Girl!", lead);
                setTimeout(function () {
                    InteractionLabel("Hello Amy!", NPC_2);
                }, 2000);
            }
        }

        // 创建对话气泡的方法，第一个参数为内容，第二个参数为挂载对象
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

        // 实现响应式的方法
        function onWindowResize() {

            // 重置相机的长宽比
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();

            // 重置渲染器的长宽
            renderer.setSize(window.innerWidth, window.innerHeight);
            labelRenderer.setSize(window.innerWidth, window.innerHeight);

            // 重新渲染
            renderer.render(scene, camera);
            labelRenderer.render(scene, camera);
        }
    }

    // 初始化性能工具
    function initStats(type) {

        // 创建显示块
        const panelType = (typeof type !== 'undefined' && type) && (!isNaN(type)) ? parseInt(type) : 0;

        // 创建性能工具实例
        const stats = new Stats();

        // 显示性能
        stats.showPanel(panelType); // 0: fps, 1: ms, 2: mb, 3+: custom
        document.body.appendChild(stats.dom);

        return stats;
    }
}