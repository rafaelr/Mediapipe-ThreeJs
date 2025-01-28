import * as THREE from "https://esm.sh/three";
import { Pane } from "https://esm.sh/tweakpane";
import { HandControls } from "./HandControls.js";
import { MediaPipeHands } from "./MediaPipeHands.js";
import { ScenesManager } from "./ScenesManager.js";
import { OBJLoader } from "https://esm.sh/three/examples/jsm/loaders/OBJLoader.js";

export class App {
  constructor() {
    this.pane = new Pane();
    this.dragging = false;

    const videoElement = document.getElementsByClassName("input_video")[0];
    ScenesManager.setup();

    this.mediaPiepeHands = new MediaPipeHands(videoElement, (landmarks) =>
      this.onMediaPipeHandsResults(landmarks)
    );
    this.mediaPiepeHands.start();
    this.build();

    ScenesManager.renderer.setAnimationLoop(() => this.animate());
  }

  onMediaPipeHandsResults(landmarks) {
    if (this.handControls) {
      this.handControls.update(landmarks);
    }
  }

  async build() {
    const planeGeometry = new THREE.PlaneGeometry(100, 100);
    planeGeometry.rotateX(-Math.PI / 2);
    const planeMaterial = new THREE.ShadowMaterial({
      color: 0x000000,
      opacity: 0.2,
    });

    const plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.position.y = -1;
    plane.receiveShadow = true;
    ScenesManager.scene.add(plane);

    const helper = new THREE.GridHelper(20, 10);
    helper.position.y = -0.9;
    helper.material.opacity = 0.25;
    helper.material.transparent = true;
    ScenesManager.scene.add(helper);

    const objects = [];
    const geometry = new THREE.BoxGeometry(0.15, 0.15, 0.15);
    const object = new THREE.Mesh(
      geometry,
      new THREE.MeshNormalMaterial({ transparent: true })
    );
    for (let i = 0; i < 3; i++) {
      const mat = new THREE.MeshNormalMaterial({ transparent: true });
      const _object = object.clone();
      _object.material = mat;

      _object.position.x = Math.random() * 2 - 1;
      _object.position.y = Math.random() * 0.5 - 0.25;
      _object.position.z = Math.random() * 2 - 1;

      _object.rotation.x = Math.random() * 2 * Math.PI;
      _object.rotation.y = Math.random() * 2 * Math.PI;
      _object.rotation.z = Math.random() * 2 * Math.PI;

      _object.castShadow = true;
      _object.receiveShadow = true;

      ScenesManager.scene.add(_object);
      objects.push(_object);
    }

    const cursorMat = new THREE.MeshNormalMaterial({
      depthTest: false,
      depthWrite: false,
    });

    const cursorOpened = await this.loadModel('models/opened.obj', cursorMat);
    ScenesManager.cursorClosed = await this.loadModel('models/closed.obj', cursorMat);
    ScenesManager.cursorClosed.rotateX(-Math.PI / 2);
    ScenesManager.cursorClosed.rotateY(-Math.PI*2);
    ScenesManager.cursorClosed.rotateZ(Math.PI/2);
    ScenesManager.cursorClosed.scale.set(0.04, 0.02, 0.04);
    

    ScenesManager.scene.add(cursorOpened);

    this.handControls = new HandControls(
      cursorOpened,
      objects,
      ScenesManager.renderer,
      ScenesManager.camera,
      ScenesManager.scene,
      true
    );

    const PARAMS = {
      showLandmark: false,
    };
    this.pane.addBinding(PARAMS, "showLandmark").on("change", (ev) => {
      this.handControls.show3DLandmark(ev.value);
    });

    this.handControls.addEventListener("drag_start", (event) => {
      event.object.material.opacity = 0.4;
      ScenesManager.scene.remove(cursorOpened);
      ScenesManager.scene.add(ScenesManager.cursorClosed);
     
      this.dragging = true;
    });

    this.handControls.addEventListener("drag_end", (event) => {
      this.dragging = false;
      ScenesManager.scene.remove(ScenesManager.cursorClosed);
      ScenesManager.scene.add(cursorOpened);
      if (event.object) event.object.material.opacity = 1;
      event.callback();
    });

    this.handControls.addEventListener("collision", (event) => {
      if (event.state === "on") {
    
      } else {
    
      }
    });

    window.addEventListener("resize", this.onWindowResize, false);
  }

  async loadModel(url, material) {
    return new Promise((resolve, reject) => {
      const loader = new OBJLoader();
      loader.load(
        url,
        (model) => {
          model.traverse((child) => {
            if (child.isMesh) {
              child.material = material;
            }
          });
          model.scale.set(0.02, 0.01, 0.02);
          model.rotateX(-Math.PI / 2);
          model.rotateZ(-Math.PI );
          
          resolve(model);
        },
        undefined,
        (error) => reject(error)
      );
    });
  }


  onWindowResize() {
    ScenesManager.camera.aspect = window.innerWidth / window.innerHeight;
    ScenesManager.camera.updateProjectionMatrix();

    ScenesManager.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  animate() {
    this.handControls?.animate();
    ScenesManager.render();
    if(this.dragging) {
      console.log('dragging');
      console.log(this.handControls.target.position);
      //set this.handControls.target.position to hand closed
      ScenesManager.cursorClosed.position.copy(this.handControls.target.position).sub(new THREE.Vector3(-0.2, 0.2, 0.2));
      
     }
    
  }
}

document.addEventListener("DOMContentLoaded", () => new App());
