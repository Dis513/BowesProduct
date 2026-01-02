<model-viewer
  id="werewolfViewer"
  src="models/werewolf.glb"
  alt="3D Werewolf"
  camera-controls
  auto-rotate
  shadow-intensity="1"
  exposure="1"
  style="background:#020617;"
>
  <div slot="progress-bar" class="progress-message">
    Loading Werewolf…
    // Variables to track originals (add near your other globals)
let originalMaterials = [];
let isPaintModeUnlit = false;
let currentModel; // Assume this is your loaded gltf.scene or the main mesh/group – replace if named differently

// Function to switch to unlit for accurate painting
function enableUnlitPaintMode() {
    if (isPaintModeUnlit) return;
    
    originalMaterials = [];
    
    currentModel.traverse((child) => {
        if (child.isMesh && child.material) {
            // Store original material
            originalMaterials.push({
                mesh: child,
                material: child.material.clone() // Clone to be safe
            });
            
            // Switch to unlit – shows vertex colors at full brightness
            const unlitMat = new THREE.MeshBasicMaterial({
                vertexColors: true,
                color: 0xffffff // No base tint
                // map: null // Uncomment if you want to ignore base textures completely during paint
            });
            
            child.material = unlitMat;
            child.material.needsUpdate = true;
        }
    });
    
    isPaintModeUnlit = true;
    
    // Optional: Neutral lighting to avoid any residual shading
    if (scene.environment) scene.environment = null;
    if (renderer) renderer.toneMappingExposure = 1.0;
}

// Function to restore PBR look
function disableUnlitPaintMode() {
    if (!isPaintModeUnlit) return;
    
    originalMaterials.forEach((entry) => {
        entry.mesh.material.dispose(); // Clean up unlit
        entry.mesh.material = entry.material;
        entry.mesh.material.needsUpdate = true;
    });
    
    originalMaterials = [];
    isPaintModeUnlit = false;
    
    // Restore your environment/lighting if needed
    // loadYourEnvironment();
}

// Hook into your existing "Activate Paint Mode" button
// Find your button (replace selector if different, e.g. '#paint-mode-btn' or '.paint-btn')
const paintModeButton = document.querySelector('button[onclick*="Paint Mode"]') || 
                         document.getElementById('activate-paint-btn') || 
                         document.querySelector('input[value="Activate Paint Mode"]');

if (paintModeButton) {
    paintModeButton.addEventListener('click', () => {
        const isActivating = paintModeButton.textContent.includes('Activate') || 
                             paintModeButton.value.includes('Activate');
        
        if (isActivating) {
            enableUnlitPaintMode();
        } else {
            disableUnlitPaintMode();
        }
    });
}

// Also restore on export to keep PBR look in exported GLB
// Find your export button (replace selector if needed)
const exportButton = document.querySelector('#export-button') || 
                     document.querySelector('button[onclick*="Export"]');

if (exportButton) {
    exportButton.addEventListener('click', () => {
        disableUnlitPaintMode(); // Ensure export has proper materials
    });
}
  </div>
</model-viewer>

