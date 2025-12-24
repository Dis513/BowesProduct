const canvas = document.getElementById("viewer");

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf5f7fb);

const camera = new THREE.PerspectiveCamera(
  45,
  canvas.clientWidth / 500,
  0.1,
  1000
);

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true
});
renderer.setSize(canvas.clientWidth, 500);
renderer.setPixelRatio(window.devicePixelRatio);

// Controls
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(0, 0, 0);

// Lights
scene.add(new THREE.AmbientLight(0xffffff, 0.8));
const dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
dirLight.position.set(5, 10, 7);
scene.add(dirLight);

// Load model
const loader = new THREE.GLTFLoader();
loader.load("models/demo-model.glb", (gltf) => {
  const model = gltf.scene;
  scene.add(model);

  // 🔑 CENTER + FRAME MODEL
  const box = new THREE.Box3().setFromObject(model);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());

  model.position.sub(center);

  const maxDim = Math.max(size.x, size.y, size.z);
  camera.position.set(0, maxDim * 0.8, maxDim * 2.2);
  controls.update();
});

// Resize fix
window.addEventListener("resize", () => {
  renderer.setSize(canvas.clientWidth, 500);
  camera.aspect = canvas.clientWidth / 500;
  camera.updateProjectionMatrix();
});

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}

animate();
