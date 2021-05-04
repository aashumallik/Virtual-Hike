// All THREE.js libraries are loaded through unpkg.com, because it's easy to 
// keep their version consistent. I used three v91 which isn't the newest, but
// it's the version that is compatible with the Terrain generator library.

// If the project will be further maintained it would be a good idea to setup
// some build system instead (like `esbuild`) and keep all dependencies in
// package.json .

import "https://unpkg.com/three@0.91.0/examples/js/controls/FirstPersonControls.js";
import "https://unpkg.com/three@0.91.0/examples/js/controls/PointerLockControls.js";

// Terrain and Water classes are extracted to the separate files. It's a good 
// practice to have one class per file and name the file the same as the class
// that it contains. This way it's always easy to find the code you are 
// looking for.

import { Terrain } from "./libs/Terrain.js";
import { Water } from "./libs/Water.js";

// Paramaters for fine-tuning

var audioPath = 'audio/soundscape.mp3';
var terrainMaxHeight = 2000;
var terrainMinHeight = -1000;
var waterLevel = -30;

import { coordX } from './libs/Terrain.js';
import { coordY } from './libs/Terrain.js';
import { coordZ } from './libs/Terrain.js';

// Script state variables

var camera;
var clock;
var controls;
var fpsCamera;
var frameDelta = 0;
var gui = new dat.GUI();
var INV_MAX_FPS = 1 / 100;
var loadingElement = document.getElementById("loading");
var renderer;
var scene;
var skyDome;
var skyLight;
var terrain;
var water;
var useFPS = false;
var isStarted = false;
var controlsEnabled = false;
var moveForward = false;
var moveBackward = false;
var moveLeft = false;
var moveRight = false;
var canJump = false;
var prevTime = performance.now();
var velocity = new THREE.Vector3();

var blocker = document.getElementById('blocker');
var instructions = document.getElementById('body');

var havePointerLock = 'pointerLockElement' in document || 'mozPointerLockElement' in document || 'webkitPointerLockElement' in document;

//Check if browser supports pointerlockcontrol
if (havePointerLock) {
    var element = document.body;
    var pointerlockchange = function (event) {
        if (document.pointerLockElement === element || document.mozPointerLockElement === element || document.webkitPointerLockElement === element) {
            controlsEnabled = true;
            //controls.enabled = true;
            //blocker.style.display = 'none';
        } else {
            //controls.enabled = false;
            //blocker.style.display = '-webkit-box';
            blocker.style.display = '-moz-box';
            blocker.style.display = 'box';
            instructions.style.display = '';
        }
    };
    var pointerlockerror = function (event) {
        instructions.style.display = '';
    };

    // Hook pointer lock state change events
    document.addEventListener('pointerlockchange', pointerlockchange, false);
    document.addEventListener('mozpointerlockchange', pointerlockchange, false);
    document.addEventListener('webkitpointerlockchange', pointerlockchange, false);
    document.addEventListener('pointerlockerror', pointerlockerror, false);
    document.addEventListener('mozpointerlockerror', pointerlockerror, false);
    document.addEventListener('webkitpointerlockerror', pointerlockerror, false);
    instructions.addEventListener('click', function (event) {
        //start.style.display = 'none';

        // Ask the browser to lock the pointer
        element.requestPointerLock = element.requestPointerLock || element.mozRequestPointerLock || element.webkitRequestPointerLock;
        if (/Firefox/i.test(navigator.userAgent)) {
            var fullscreenchange = function (event) {
                if (document.fullscreenElement === element || document.mozFullscreenElement === element || document.mozFullScreenElement === element) {
                    document.removeEventListener('fullscreenchange', fullscreenchange);
                    document.removeEventListener('mozfullscreenchange', fullscreenchange);
                    element.requestPointerLock();
                }
            };
            document.addEventListener('fullscreenchange', fullscreenchange, false);
            document.addEventListener('mozfullscreenchange', fullscreenchange, false);
            element.requestFullscreen = element.requestFullscreen || element.mozRequestFullscreen || element.mozRequestFullScreen || element.webkitRequestFullscreen;
            element.requestFullscreen();
        } else {
            element.requestPointerLock();
        }
    }, false);
} else {
    instructions.innerHTML = 'Your browser doesn\'t seem to support Pointer Lock API';
}

document.getElementById('start-button').addEventListener('click', function () {
    // Now it is the moment to start the audio.
    sound.play();

    // Everything is loaded and user started the scene.
    isStarted = true;

    // Those classes are used to gently (fade-in) reveal the scene.
    renderer.domElement.classList.remove('not-started');
    renderer.domElement.classList.add('started');

    // Remove 'loaded' screen.
    document.getElementById('loaded').remove();

    controls = new THREE.PointerLockControls(camera);
    controls.enabled = true;
    scene.add(controls.getObject());  
});

//Handle key events for movement
var onKeyDown = function (event) {
    switch (event.keyCode) {
        case 38: // up
        case 87: // w
            moveForward = true;
            break;
        case 37: // left
        case 65: // a
            moveLeft = true;
            break;
        case 40: // down
        case 83: // s
            moveBackward = true;
            break;
        case 39: // right
        case 68: // d
            moveRight = true;
            break;
        case 79:
            showSolution();
            break;
        case 80:
            removeSolution();
            break;
        case 72:
            showHint(locationx, locationz);
            break;
        case 70:
            if (fly) {
                fly = false;
            } else {
                fly = true;
            }
        case 32: // space
            if (canJump === true && camera.position.y < 12) {
                velocity.y += 350;
            }
            break;
    }
};
var onKeyUp = function (event) {
    switch (event.keyCode) {
        case 38: // up
        case 87: // w
            moveForward = false;
            break;
        case 37: // left
        case 65: // a
            moveLeft = false;
            break;
        case 40: // down
        case 83: // s
            moveBackward = false;
            break;
        case 39: // right
        case 68: // d
            moveRight = false;
            break;
    }
};

document.addEventListener('keydown', onKeyDown, false);
document.addEventListener('keyup', onKeyUp, false);

// Audio
var audioListener = new THREE.AudioListener();
// This variable is used to wait with rendering until the song is actually 
// loaded.
var isAudioLoaded = false
var sound = new THREE.Audio(audioListener);

// Order in this function is important. It's a good thing to update objects
// first and render later, so the rendered scene will immediately look as it 
// should.

function animate() {
    frameDelta += clock.getDelta();
    while (frameDelta >= INV_MAX_FPS) {
        //update(INV_MAX_FPS);
        frameDelta -= INV_MAX_FPS;
    }

    draw();
    requestAnimationFrame(animate);

    if (controlsEnabled) {

      
        var time = performance.now();
        //Set velocity of user 
        var delta = (time - prevTime) / 1000;
        var gamma = (time - prevTime) / 10000;
        
        velocity.y -= 9.8 * 100.0 * delta; // 100.0 = mass
		velocity.x -= velocity.x * 10.0 * delta;
		velocity.z -= velocity.z * 10.0 * delta;

        if (moveForward) {
          
                velocity.z -= 1500.0 * delta;
                controls.getObject().translateX(velocity.x * delta);
                controls.getObject().translateY(velocity.y * delta);
                controls.getObject().translateZ(velocity.z * delta);
            
        } else if (moveBackward) {
            
                velocity.z += 1500.0 * delta;
                controls.getObject().translateX(velocity.x * delta);
                controls.getObject().translateY(velocity.y * delta);
                controls.getObject().translateZ(velocity.z * delta);
            
        } else if (moveLeft) {
           
                velocity.x -= 1500.0 * delta;
                controls.getObject().translateX(velocity.x * delta);
                controls.getObject().translateY(velocity.y * delta);
                controls.getObject().translateZ(velocity.z * delta);

        } else if (moveRight) {
            
                velocity.x += 1500.0 * delta;
                controls.getObject().translateX(velocity.x * delta);
                controls.getObject().translateY(velocity.y * delta);
                controls.getObject().translateZ(velocity.z * delta);
            
        } else {
            velocity.x = 0;
            velocity.z = 0;
        }
        console.log();
        
        for (var i = 0; i < coordX.length; i++) {
            if (coordX[i] == Math.round(camera.position.x)) {
                if (coordZ[i] == Math.round(camera.position.z)) {
                    console.log("HIT");
                }
            }
        }

        if (controls.getObject().position.y < 10) {
            velocity.y = 0;
            controls.getObject().position.y = 10;
            canJump = true;
        }
        prevTime = time;
    }
}

function startAnimating() {
    clock.start();
    requestAnimationFrame(animate);
}

function setup() {
    setupThreeJS();
    setupAudio();
    setupControls();
    setupWorld();
    setupTerrain();
    setupWater();
    startAnimating();
}

function setupThreeJS() {
    scene = new THREE.Scene();

    // Fog was used here for cosmetic effect, but in general it also can be used
    // to mask rendering distance and prevent objects to immediately appear in 
    // the view when camera moves.

    scene.fog = new THREE.FogExp2(0x868293, 0.0007);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);

    renderer.domElement.classList.add('not-started');
    document.body.appendChild(renderer.domElement);

    renderer.domElement.setAttribute('tabindex', -1);
    
    camera = new THREE.PerspectiveCamera(70, renderer.domElement.width / renderer.domElement.height, 1, 20000);
    camera.add(audioListener)

    scene.add(camera);

    /** 
    camera.position.x = 450;
    camera.position.y = 300;
    camera.position.z = 375;
    camera.rotation.x = -50 * Math.PI / 180;
    camera.rotation.y = 35 * Math.PI / 180;
    camera.rotation.z = 35 * Math.PI / 180;
    */

    clock = new THREE.Clock(false);
}

function setupAudio() {
    var audioLoader = new THREE.AudioLoader();

    audioLoader.load(audioPath, function (buffer) {
        sound.setBuffer(buffer);
        sound.setLoop(true);
        sound.setVolume(1);

        // Song cannot be played yet, it will be blocked by the browser. Audio
        // can only respond to a user initiated event like pressing a button.
        isAudioLoaded = true;
    });
}

function setupControls() {
    /**controls = PointerLockControls(camera, document.body);
    controls.freeze = true;
    controls.movementSpeed = 100;
    controls.lookSpeed = 0.075;*/
}

/** 
const start = document.getElementById('start-button');
start.addEventListener('click', function () {

    controls.lock();
});
*/

function setupWorld() {
    // Sets up the sky as a giant sphere in which the terrain will be inside
    new THREE.TextureLoader().load('img/sky1.jpg', function (t1) {
        skyDome = new THREE.Mesh(
            new THREE.SphereGeometry(8192, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.5),
            new THREE.MeshBasicMaterial({ map: t1, side: THREE.BackSide, fog: false })
        );
        skyDome.position.y = -99;
        scene.add(skyDome);
    });

    skyLight = new THREE.DirectionalLight(0xe8bdb0, 1.5);
    // Sun on the sky texture
    skyLight.position.set(2950, 2625, -160);
    scene.add(skyLight);
    var light = new THREE.DirectionalLight(0xc3eaff, 0.75);
    light.position.set(-1, -0.5, -1);
    scene.add(light);
}

function setupTerrain() {
    terrain = new Terrain(scene, waterLevel, terrainMinHeight, terrainMaxHeight, useFPS);

}

function setupWater() {
    water = new Water(scene, skyLight, waterLevel);
}

function draw() {
    if (!isAudioLoaded) {
        return;
    }

    // Remove the loading screen
    if (loadingElement) {
        loadingElement.remove();
        loadingElement = null;
    }

    if (!isStarted) {
        // User did not press the start button yet.
        return;
    }

    if (!terrain || terrain.isLoading) {
        return;
    }

    if (!water || water.isLoading) {
        return;
    }

    renderer.render(scene, camera);
}

function update(delta) {
    // Rotation is calculated here and assigned to both terrain and water to make
    // sure they are perfectly aligned.
    const rotationZ = Date.now() * 0.00001;

    //if (controls.update) controls.update(delta);

    if (terrain) {
        terrain.rotationZ = rotationZ;
        terrain.update(delta);
    }

    if (water) {
        water.rotationZ = rotationZ;
        water.update(delta);
    }
}

setup()

window.addEventListener('resize', function () {

    var inWidth = window.innerWidth
    var inHeight = window.innerHeight
    var aspect = inWidth / inHeight;

    if (camera) {
        camera.aspect = aspect;
        camera.updateProjectionMatrix();
    }

    if (fpsCamera) {
        camera.aspect = aspect;
        camera.updateProjectionMatrix();
    }

    if (renderer) {
        renderer.setSize(inWidth, inHeight);
    }

});