import * as THREE from 'three';
import { TransformControls } from 'three/addons/controls/TransformControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export function initTerrainEditor(scene, camera, renderer, terrainMesh) {
    const gltfLoader = new GLTFLoader();
    const placedModels = []; // Array to store all placed model meshes
    let activeModelScene = null; // The template scene of the uploaded model
    let activeModelUrl = null;
    let activeModelFilename = null;
    let currentSnapping = false;

    // --- Transform Controls ---
    const transformControl = new TransformControls(camera, renderer.domElement);
    transformControl.setSpace('local');
    scene.add(transformControl.getHelper());

    transformControl.addEventListener('dragging-changed', function (event) {
        if (window.editorState) {
            window.editorState.isDragging = event.value;
        }
    });

    // --- UI Setup ---
    const uiContainer = document.createElement('div');
    uiContainer.id = 'terrain-editor-ui';
    uiContainer.style.position = 'absolute';
    uiContainer.style.top = '120px';
    uiContainer.style.left = '20px';
    uiContainer.style.background = 'rgba(0, 0, 0, 0.7)';
    uiContainer.style.padding = '15px';
    uiContainer.style.borderRadius = '8px';
    uiContainer.style.color = 'white';
    uiContainer.style.fontFamily = 'sans-serif';
    uiContainer.style.zIndex = '1000';
    uiContainer.style.display = 'flex';
    uiContainer.style.flexDirection = 'column';
    uiContainer.style.gap = '10px';
    document.body.appendChild(uiContainer);

    const title = document.createElement('h3');
    title.innerText = 'Terrain Editor';
    title.style.margin = '0 0 10px 0';
    uiContainer.appendChild(title);

    // Upload Input
    const uploadLabel = document.createElement('label');
    uploadLabel.innerText = 'Upload GLB/GLTF: ';
    const uploadInput = document.createElement('input');
    uploadInput.type = 'file';
    uploadInput.accept = '.glb,.gltf';
    uploadLabel.appendChild(uploadInput);
    uiContainer.appendChild(uploadLabel);

    // Action Buttons Row
    const actionRow = document.createElement('div');
    actionRow.style.display = 'flex';
    actionRow.style.gap = '5px';
    uiContainer.appendChild(actionRow);

    const btnSave = document.createElement('button');
    btnSave.innerText = 'Save JSON';
    const btnLoad = document.createElement('button');
    btnLoad.innerText = 'Load JSON';
    const loadInput = document.createElement('input');
    loadInput.type = 'file';
    loadInput.accept = '.json';
    loadInput.style.display = 'none';
    actionRow.appendChild(btnSave);
    actionRow.appendChild(btnLoad);
    actionRow.appendChild(loadInput);

    // Toggles Row
    const toggleRow = document.createElement('div');
    toggleRow.style.display = 'flex';
    toggleRow.style.gap = '5px';
    uiContainer.appendChild(toggleRow);

    const btnSpace = document.createElement('button');
    btnSpace.innerText = 'Space: Local';
    const btnSnap = document.createElement('button');
    btnSnap.innerText = 'Snap: OFF';
    toggleRow.appendChild(btnSpace);
    toggleRow.appendChild(btnSnap);

    // Contextual UI (hidden by default)
    const contextUI = document.createElement('div');
    contextUI.style.display = 'none';
    contextUI.style.flexDirection = 'column';
    contextUI.style.gap = '5px';
    contextUI.style.marginTop = '10px';
    contextUI.style.borderTop = '1px solid #555';
    contextUI.style.paddingTop = '10px';
    uiContainer.appendChild(contextUI);

    const contextTitle = document.createElement('div');
    contextTitle.innerText = 'Selected Object:';
    contextTitle.style.fontWeight = 'bold';
    contextUI.appendChild(contextTitle);

    const contextBtnRow1 = document.createElement('div');
    contextBtnRow1.style.display = 'flex';
    contextBtnRow1.style.gap = '5px';
    contextUI.appendChild(contextBtnRow1);

    const btnMove = document.createElement('button');
    btnMove.innerText = 'Move';
    const btnRotate = document.createElement('button');
    btnRotate.innerText = 'Rotate';
    const btnScale = document.createElement('button');
    btnScale.innerText = 'Scale';
    contextBtnRow1.appendChild(btnMove);
    contextBtnRow1.appendChild(btnRotate);
    contextBtnRow1.appendChild(btnScale);

    const contextBtnRow2 = document.createElement('div');
    contextBtnRow2.style.display = 'flex';
    contextBtnRow2.style.gap = '5px';
    contextUI.appendChild(contextBtnRow2);

    const btnClone = document.createElement('button');
    btnClone.innerText = 'Clone';
    const btnDelete = document.createElement('button');
    btnDelete.innerText = 'Delete';
    btnDelete.style.background = '#aa3333';
    btnDelete.style.color = 'white';
    contextBtnRow2.appendChild(btnClone);
    contextBtnRow2.appendChild(btnDelete);


    // --- UI Logic ---
    const settingsControls = document.getElementById('settings-controls');
    if (settingsControls) {
        const btnToggleEditor = document.createElement('button');
        btnToggleEditor.id = 'editor-toggle';
        btnToggleEditor.innerText = 'Hide Editor';
        settingsControls.appendChild(btnToggleEditor);

        let isEditorHidden = false;
        btnToggleEditor.addEventListener('click', () => {
            isEditorHidden = !isEditorHidden;
            uiContainer.style.display = isEditorHidden ? 'none' : 'flex';
            btnToggleEditor.innerText = isEditorHidden ? 'Show Editor' : 'Hide Editor';
        });
    }
    function updateContextUI() {
        if (transformControl.object) {
            contextUI.style.display = 'flex';
        } else {
            contextUI.style.display = 'none';
        }
    }

    uploadInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (activeModelUrl) {
            URL.revokeObjectURL(activeModelUrl);
        }

        activeModelUrl = URL.createObjectURL(file);
        activeModelFilename = file.name;
        
        gltfLoader.load(activeModelUrl, (gltf) => {
            activeModelScene = gltf.scene;
            console.log('Model loaded:', activeModelFilename);
        }, undefined, (error) => {
            console.error('Error loading model:', error);
        });
    });

    btnSpace.addEventListener('click', () => {
        const current = transformControl.space;
        const next = current === 'local' ? 'world' : 'local';
        transformControl.setSpace(next);
        btnSpace.innerText = `Space: ${next.charAt(0).toUpperCase() + next.slice(1)}`;
    });

    btnSnap.addEventListener('click', () => {
        currentSnapping = !currentSnapping;
        if (currentSnapping) {
            transformControl.setTranslationSnap(1);
            transformControl.setRotationSnap(Math.PI / 8);
            btnSnap.innerText = 'Snap: ON';
        } else {
            transformControl.setTranslationSnap(null);
            transformControl.setRotationSnap(null);
            btnSnap.innerText = 'Snap: OFF';
        }
    });

    btnMove.addEventListener('click', () => transformControl.setMode('translate'));
    btnRotate.addEventListener('click', () => transformControl.setMode('rotate'));
    btnScale.addEventListener('click', () => transformControl.setMode('scale'));

    function createClone(sourceObj, positionOffset = new THREE.Vector3(0, 0, 0)) {
        if (!sourceObj) return null;
        const clone = sourceObj.clone();
        
        // Traverse to set shadows and re-use materials if needed
        clone.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });

        clone.position.copy(sourceObj.position).add(positionOffset);
        clone.rotation.copy(sourceObj.rotation);
        clone.scale.copy(sourceObj.scale);
        
        // Store metadata for saving
        clone.userData.filename = sourceObj.userData ? sourceObj.userData.filename : activeModelFilename;

        scene.add(clone);
        placedModels.push(clone);
        return clone;
    }

    btnClone.addEventListener('click', () => {
        if (!transformControl.object) return;
        const clone = createClone(transformControl.object, new THREE.Vector3(5, 0, 5));
        transformControl.attach(clone);
        updateContextUI();
    });

    btnDelete.addEventListener('click', () => {
        if (!transformControl.object) return;
        const obj = transformControl.object;
        transformControl.detach();
        updateContextUI();

        scene.remove(obj);
        const index = placedModels.indexOf(obj);
        if (index > -1) {
            placedModels.splice(index, 1);
        }

        // Deep dispose
        obj.traverse((child) => {
            if (child.isMesh) {
                if (child.geometry) child.geometry.dispose();
                if (child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach(m => m.dispose());
                    } else {
                        child.material.dispose();
                    }
                }
            }
        });
    });

    // Save logic
    btnSave.addEventListener('click', () => {
        const data = placedModels.map(model => ({
            filename: model.userData.filename,
            position: model.position.toArray(),
            rotation: model.rotation.toArray().slice(0, 3), // Euler to array [x,y,z,order]
            scale: model.scale.toArray()
        }));
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'terrain_layout.json';
        a.click();
        URL.revokeObjectURL(url);
    });

    // Load logic
    btnLoad.addEventListener('click', () => {
        loadInput.click();
    });

    loadInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target.result);
                
                // Clear existing models
                transformControl.detach();
                updateContextUI();
                
                placedModels.forEach(obj => {
                    scene.remove(obj);
                    obj.traverse((child) => {
                        if (child.isMesh) {
                            if (child.geometry) child.geometry.dispose();
                            if (child.material) {
                                if (Array.isArray(child.material)) child.material.forEach(m => m.dispose());
                                else child.material.dispose();
                            }
                        }
                    });
                });
                placedModels.length = 0;

                alert("Note: Browsers cannot automatically read local files for security reasons. The loader will use the currently active uploaded model for placement. Ensure you've uploaded a valid GLB/GLTF first.");
                
                if (!activeModelScene) {
                    console.error("No active model loaded to clone from.");
                    return;
                }

                data.forEach(item => {
                    const clone = createClone(activeModelScene);
                    clone.position.fromArray(item.position);
                    clone.rotation.fromArray(item.rotation);
                    clone.scale.fromArray(item.scale);
                    clone.userData.filename = item.filename;
                });
                
            } catch (err) {
                console.error('Error parsing JSON:', err);
                alert('Invalid JSON file.');
            }
        };
        reader.readAsText(file);
    });


    // --- Raycasting & Placement ---
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    // We only want to place/select on click, not during camera drag. 
    // We'll track pointer down/up.
    let pointerDownPos = new THREE.Vector2();

    renderer.domElement.addEventListener('pointerdown', (e) => {
        pointerDownPos.set(e.clientX, e.clientY);
    });

    renderer.domElement.addEventListener('pointerup', (e) => {
        // If we moved the mouse a lot, it was a drag, don't place/select
        if (Math.abs(e.clientX - pointerDownPos.x) > 5 || Math.abs(e.clientY - pointerDownPos.y) > 5) {
            return;
        }

        // If transform controls is currently doing something, ignore
        if (window.editorState && window.editorState.isDragging) return;

        mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);

        // 1. Check placed models
        // We raycast against all children of placed models
        let hitModel = false;
        for (let i = 0; i < placedModels.length; i++) {
            const intersects = raycaster.intersectObject(placedModels[i], true);
            if (intersects.length > 0) {
                transformControl.attach(placedModels[i]);
                hitModel = true;
                break;
            }
        }

        if (hitModel) {
            updateContextUI();
            return;
        }

        // 2. If no model hit, check terrain
        if (terrainMesh) {
            const intersects = raycaster.intersectObject(terrainMesh, false);
            if (intersects.length > 0) {
                const point = intersects[0].point;
                
                if (activeModelScene) {
                    const clone = createClone(activeModelScene);
                    // Override position
                    clone.position.copy(point);
                    clone.userData.filename = activeModelFilename;
                    
                    transformControl.attach(clone);
                } else {
                    console.warn('No active model to place. Upload a GLB first.');
                }
                updateContextUI();
                return;
            }
        }

        // 3. Clicked empty space
        transformControl.detach();
        updateContextUI();
    });
}
