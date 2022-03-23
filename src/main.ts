import "./main.css";
import {
  Scene,
  PerspectiveCamera,
  WebGLRenderer,
  ACESFilmicToneMapping,
  sRGBEncoding,
  PMREMGenerator,
  Color,
  Box3,
  Vector3,
} from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { palettes } from "./palettes";
import { GUI } from "three/examples/jsm/libs/lil-gui.module.min.js";

// make palettes
const contexts = [];
const canvas1 = document.getElementById("canvas1") as HTMLCanvasElement;
contexts[0] = canvas1.getContext("2d");
const canvas2 = document.getElementById("canvas2") as HTMLCanvasElement;
contexts[1] = canvas2.getContext("2d");
const canvas3 = document.getElementById("canvas3") as HTMLCanvasElement;
contexts[2] = canvas3.getContext("2d");

const N = 4,
  unit = 75;
for (let i = 0; i < palettes.length; i++) {
  const colors = palettes[i];
  for (var j = 0; j < colors.length; j++) {
    let n = Math.floor(j / N);
    let r = colors[j][0];
    let g = colors[j][1];
    let b = colors[j][2];
    contexts[i].fillStyle = "rgba(" + r + "," + g + "," + b + ",1)";
    contexts[i].fillRect((j - n * N) * unit, n * unit, unit, unit);
  }
}

let object;
const models = {
  a: "1.glb",
  b: "3.glb",
  c: "4.glb",
  d: "6.glb",
};

const api = {
  model: models.d,
};

const gui = new GUI();
gui.add(api, "model", models).onChange(loadModel);
const scene = new Scene();
const camera = new PerspectiveCamera(
  30,
  window.innerWidth / window.innerHeight,
  0.01,
  1000
);
camera.position.set(0, 2, 5);

const renderer = new WebGLRenderer({ antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = ACESFilmicToneMapping;
renderer.toneMappingExposure = 1;
renderer.outputEncoding = sRGBEncoding;
document.body.appendChild(renderer.domElement);

const environment = new RoomEnvironment();
const pmremGenerator = new PMREMGenerator(renderer);

scene.background = new Color(0xbbbbbb);
scene.environment = pmremGenerator.fromScene(environment).texture;

window.onresize = (_) => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
};

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.minDistance = 1;
controls.maxDistance = 100;
controls.update();

const loader = new GLTFLoader();
loadModel();
async function loadModel() {
  if (object) {
    object.traverse((child) => {
      if (child.isMesh) {
        child.geometry.dispose();
        child.material.dispose();
      }
    });
    scene.remove(object);
    object = null;
  }
  loader.load(
    require("../assets/" + api.model),
    (gltf) => {
      gltf.scene.scale.set(10, 10, 10);
      object = gltf.scene;
      scene.add(gltf.scene);
      adjustCamera();
      requestAnimationFrame(animate);
    },
    undefined,
    (err) => console.error("Failed to load model", err)
  );
}

// adjust camera position according to the object size
function adjustCamera() {
  if (!object) return;
  const boundingBox = new Box3().setFromObject(object);
  const size = boundingBox.getSize(new Vector3()).length();
  const center = boundingBox.getCenter(new Vector3());
  if (controls) controls.target = center;

  camera.position.set(size * 1.5, size * 2, size * 1.5);
}

function applyPalette(paletteIndex) {
  let childIndex = 0;
  object.traverse((child) => {
    if (child.isMesh) {
      const rgb = palettes[paletteIndex][childIndex % 8];
      const color = "rgba(" + rgb[0] + "," + rgb[1] + "," + rgb[2] + ",1)";
      child.material.color = new Color(color);
      childIndex++;
    }
  });
}

canvas1.addEventListener("click", () => {
  applyPalette(0);
});

canvas2.addEventListener("click", () => {
  applyPalette(1);
});

canvas3.addEventListener("click", () => {
  applyPalette(2);
});

function animate(time: number) {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
