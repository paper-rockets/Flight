const fs = require('fs');
let code = fs.readFileSync('index.html', 'utf8');

code = code.replace(
    'const CLOUD_COUNT = 100;',
    'const CLOUD_COUNT = 50;\n    const CAT_COUNT = 50;'
);

const catGen = \
    const colorBody = 0xa39a91;
    const colorDark = 0x4a3d32;
    const matCatBody = new THREE.MeshStandardMaterial({ color: colorBody, roughness: 1.0, metalness: 0.0 });
    const matCatDark = new THREE.MeshStandardMaterial({ color: colorDark, roughness: 1.0, metalness: 0.0 });
    
    function buildCatCloudGeo() {
        const pusheen = new THREE.Group();
        const dummyMatBody = new THREE.MeshBasicMaterial();
        const dummyMatDark = new THREE.MeshBasicMaterial();

        const bodyGeo = new THREE.SphereGeometry(1.6, 32, 32);
        const posAttribute = bodyGeo.attributes.position;
        for (let i = 0; i < posAttribute.count; i++) {
            let y = posAttribute.getY(i);
            if (y < 0) {
                let widthFactor = 1.0 + Math.abs(y) * 0.15; 
                posAttribute.setX(i, posAttribute.getX(i) * widthFactor);
                posAttribute.setZ(i, posAttribute.getZ(i) * widthFactor);
            }
        }
        bodyGeo.computeVertexNormals();
        const body = new THREE.Mesh(bodyGeo, dummyMatBody);
        body.scale.set(1.4, 0.95, 0.85); body.position.y = 1.35; pusheen.add(body);

        const earGeo = new THREE.SphereGeometry(0.45, 16, 16);
        const leftEar = new THREE.Mesh(earGeo, dummyMatBody);
        leftEar.scale.set(0.9, 1.2, 0.5); leftEar.position.set(-0.95, 2.5, 0.1); leftEar.rotation.z = Math.PI / 12; pusheen.add(leftEar);
        const rightEar = new THREE.Mesh(earGeo, dummyMatBody);
        rightEar.scale.set(0.9, 1.2, 0.5); rightEar.position.set(0.95, 2.5, 0.1); rightEar.rotation.z = -Math.PI / 12; pusheen.add(rightEar);

        const stripeGeo = new THREE.CylinderGeometry(0.07, 0.07, 0.55, 16);
        for(let i = -1; i <= 1; i++) {
            const stripe = new THREE.Mesh(stripeGeo, dummyMatDark);
            stripe.position.set(i * 0.35, 2.75, 0.65); stripe.rotation.x = Math.PI / 2 + 0.3; stripe.rotation.z = -i * 0.1; 
            stripe.scale.set(1, 1, 0.15); pusheen.add(stripe);
        }

        const spotGeo = new THREE.SphereGeometry(0.35, 16, 16);
        const spot1 = new THREE.Mesh(spotGeo, dummyMatDark); spot1.position.set(-1.8, 1.9, 0.3); spot1.rotation.set(0, 0, Math.PI / 4); spot1.scale.set(1, 0.7, 0.15); pusheen.add(spot1);
        const spot2 = new THREE.Mesh(spotGeo, dummyMatDark); spot2.position.set(-2.0, 1.3, 0.3); spot2.rotation.set(0, 0, Math.PI / 3); spot2.scale.set(1, 0.7, 0.15); pusheen.add(spot2);

        const eyeGeo = new THREE.SphereGeometry(0.12, 16, 16);
        const leftEye = new THREE.Mesh(eyeGeo, dummyMatDark); leftEye.position.set(-0.45, 1.45, 1.35); leftEye.scale.set(1, 1, 0.3); pusheen.add(leftEye);
        const rightEye = new THREE.Mesh(eyeGeo, dummyMatDark); rightEye.position.set(0.45, 1.45, 1.35); rightEye.scale.set(1, 1, 0.3); pusheen.add(rightEye);

        const mouthCurveGeo = new THREE.TorusGeometry(0.09, 0.035, 16, 32, Math.PI);
        const mouthLeft = new THREE.Mesh(mouthCurveGeo, dummyMatDark); mouthLeft.position.set(-0.09, 1.32, 1.38); mouthLeft.rotation.x = Math.PI; pusheen.add(mouthLeft);
        const mouthRight = new THREE.Mesh(mouthCurveGeo, dummyMatDark); mouthRight.position.set(0.09, 1.32, 1.38); mouthRight.rotation.x = Math.PI; pusheen.add(mouthRight);

        const whiskerGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.45, 16);
        const whiskerConfigs = [ { pos: [-1.6, 1.6, 1.1], rotZ: Math.PI / 2 - 0.1 }, { pos: [-1.6, 1.4, 1.1], rotZ: Math.PI / 2 + 0.1 }, { pos: [ 1.6, 1.6, 1.1], rotZ: Math.PI / 2 + 0.1 }, { pos: [ 1.6, 1.4, 1.1], rotZ: Math.PI / 2 - 0.1 } ];
        whiskerConfigs.forEach(config => {
            const whisker = new THREE.Mesh(whiskerGeo, dummyMatDark);
            whisker.position.set(...config.pos); whisker.rotation.z = config.rotZ; whisker.rotation.y = Math.sign(config.pos[0]) * -0.15; 
            pusheen.add(whisker);
        });

        const pawGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.25, 16);
        const pawPositions = [[-0.5, 0.15, 0.7], [ 0.5, 0.15, 0.7], [-1.1, 0.15, 0.6], [ 1.1, 0.15, 0.6]];
        pawPositions.forEach(pos => {
            const paw = new THREE.Mesh(pawGeo, dummyMatBody); paw.position.set(...pos);
            const pawBottomGeo = new THREE.SphereGeometry(0.12, 16, 16); const pawBottom = new THREE.Mesh(pawBottomGeo, dummyMatBody); pawBottom.position.y = -0.12;
            paw.add(pawBottom); pusheen.add(paw);
        });

        const tailGroup = new THREE.Group();
        tailGroup.position.set(1.9, 0.6, -0.2); tailGroup.rotation.z = -Math.PI / 6; pusheen.add(tailGroup);
        const tailGeo = new THREE.CylinderGeometry(0.2, 0.2, 1.0, 16);
        const tail = new THREE.Mesh(tailGeo, dummyMatBody); tail.position.set(0, 0.5, 0); 
        const tailEndGeo = new THREE.SphereGeometry(0.2, 16, 16);
        const tailTip1 = new THREE.Mesh(tailEndGeo, dummyMatBody); tailTip1.position.y = 0.5; tail.add(tailTip1);
        const tailTip2 = new THREE.Mesh(tailEndGeo, dummyMatBody); tailTip2.position.y = -0.5; tail.add(tailTip2);
        tailGroup.add(tail);
        const tailStripeGeo = new THREE.CylinderGeometry(0.21, 0.21, 0.18, 16);
        const stripePositions = [-0.1, 0.3, 0.7];
        stripePositions.forEach(yOffset => {
            const tStripe = new THREE.Mesh(tailStripeGeo, dummyMatDark); tStripe.position.set(0, yOffset, 0); tailGroup.add(tStripe);
        });

        pusheen.rotation.x = Math.PI / 2;
        pusheen.scale.setScalar(20);

        pusheen.updateMatrixWorld(true);
        const geometries = [];
        pusheen.traverse((child) => {
            if (child.isMesh) {
                const geom = child.geometry.clone();
                geom.applyMatrix4(child.matrixWorld);
                const matIndex = (child.material === dummyMatBody) ? 0 : 1;
                const nonIndexed = geom.index ? geom.toNonIndexed() : geom;
                nonIndexed.clearGroups();
                nonIndexed.addGroup(0, nonIndexed.attributes.position.count, matIndex);
                geometries.push(nonIndexed);
            }
        });
        return BufferGeometryUtils.mergeGeometries(geometries, true);
    }
    const geoCatCloud = buildCatCloudGeo();
\;

code = code.replace(
    'const instClouds = new THREE.InstancedMesh(geoCloud, matCloud, CLOUD_COUNT);',
    catGen + '\n    const instClouds = new THREE.InstancedMesh(geoCloud, matCloud, CLOUD_COUNT);\n    const instCats = new THREE.InstancedMesh(geoCatCloud, [matCatBody, matCatDark], CAT_COUNT);\n    instCats.castShadow = true;\n    scene.add(instCats);'
);

const initialPlace = \
    for (let i = 0; i < CAT_COUNT; i++) {
        dummy.position.set(
            (Math.random() - 0.5) * 3500,
            200 + Math.random() * 300,
            (Math.random() - 0.5) * 3500
        );
        dummy.rotation.set(0, Math.random() * Math.PI * 2, 0);
        dummy.scale.setScalar(0.8 + Math.random() * 0.4);
        dummy.updateMatrix();
        instCats.setMatrixAt(i, dummy.matrix);
    }
    instCats.instanceMatrix.needsUpdate = true;
\;

code = code.replace(
    'instClouds.instanceMatrix.needsUpdate = true;',
    'instClouds.instanceMatrix.needsUpdate = true;\n' + initialPlace
);

const catUpdate = \
        for (let i = 0; i < CAT_COUNT; i++) {
            instCats.getMatrixAt(i, dummy.matrix);
            dummy.matrix.decompose(dummy.position, dummy.quaternion, dummy.scale);
            
            if (Math.abs(dummy.position.x - playerX) > cloudDist || Math.abs(dummy.position.z - playerZ) > cloudDist || dummy.position.y < -500) {
                let dx = (Math.random() - 0.5) * cloudDist * 2.0;
                let dz = (Math.random() - 0.5) * cloudDist * 2.0;
                if (!isPrewarming) {
                    if (Math.random() > 0.5) dx = Math.sign(dx) * (cloudDist * 0.95) || (cloudDist * 0.95);
                    else dz = Math.sign(dz) * (cloudDist * 0.95) || (cloudDist * 0.95);
                }
                dummy.position.set(playerX + dx, 200 + Math.random() * 300, playerZ + dz);
                dummy.rotation.set(0, Math.random() * Math.PI * 2, 0);
                dummy.scale.setScalar(0.8 + Math.random() * 0.4);
            }
            
            dummy.position.x += 10.0 * dt; 
            dummy.updateMatrix();
            instCats.setMatrixAt(i, dummy.matrix);
        }
        instCats.instanceMatrix.needsUpdate = true;
\;

code = code.replace(
    'instClouds.instanceMatrix.needsUpdate = true;\n\n        // High Cumulonimbus Clouds',
    'instClouds.instanceMatrix.needsUpdate = true;\n' + catUpdate + '\n\n        // High Cumulonimbus Clouds'
);

fs.writeFileSync('index.html', code);
console.log('Cats injected successfully!');
