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
  // Hide/Show Panel Toggle
const panel = document.querySelector('.panel');
const togglePanelBtn = document.getElementById('togglePanelBtn');

if (panel && togglePanelBtn) {
    let panelHidden = false;

    togglePanelBtn.addEventListener('click', () => {
        if (panelHidden) {
            // Show panel
            panel.style.display = 'block';
            togglePanelBtn.innerHTML = '✕'; // Close icon
            panelHidden = false;
        } else {
            // Hide panel
            panel.style.display = 'none';
            panelHidden = true;
        }
    });

    // Optional: Add a floating "Show Controls" button when hidden (great for mobile/desktop)
    const floatingShowBtn = document.createElement('button');
    floatingShowBtn.id = 'floatingShowBtn';
    floatingShowBtn.innerHTML = '⚙️';
    floatingShowBtn.style.cssText = `
        position: fixed;
        bottom: 80px;
        right: 20px;
        width: 50px;
        height: 50px;
        background: #60a5fa;
        border: none;
        border-radius: 50%;
        color: white;
        font-size: 1.8rem;
        cursor: pointer;
        z-index: 999;
        display: none;
        box-shadow: 0 4px 12px rgba(0,0,0,0.4);
    `;
    document.body.appendChild(floatingShowBtn);

    floatingShowBtn.addEventListener('click', () => {
        panel.style.display = 'block';
        floatingShowBtn.style.display = 'none';
        togglePanelBtn.innerHTML = '✕';
        panelHidden = false;
    });

    // Update floating button visibility
    const originalToggle = togglePanelBtn.addEventListener('click', () => {
        if (panelHidden) {
            floatingShowBtn.style.display = 'none';
        } else {
            floatingShowBtn.style.display = 'block';
        }
    });
}
  </div>
</model-viewer>


