class PetWorld {
  constructor() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    document.body.appendChild(this.renderer.domElement);
    
    this.camera.position.z = 15;
    this.camera.position.y = 10;
    this.camera.lookAt(0, 0, 0);
    
    // Setup orbit controls
    this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    
    this.setupTerrain();
    this.setupLighting();
    this.setupNavMesh();
    
    this.pets = new Map();
    this.animate = this.animate.bind(this);
    
    // Pathfinding setup
    this.pathfinder = new THREE.Pathfinding();
    
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });

    this.animate();
  }

  setupTerrain() {
    // Create more interesting terrain using noise
    const geometry = new THREE.PlaneGeometry(50, 50, 128, 128);
    const material = new THREE.MeshStandardMaterial({
      color: 0x3c8f3c,
      metalness: 0,
      roughness: 1,
      wireframe: false
    });

    // Apply Perlin noise to vertices
    const vertices = geometry.attributes.position.array;
    for (let i = 0; i < vertices.length; i += 3) {
      const x = vertices[i];
      const z = vertices[i + 2];
      vertices[i + 1] = this.noise(x * 0.1, z * 0.1) * 2;
    }
    geometry.computeVertexNormals();

    this.ground = new THREE.Mesh(geometry, material);
    this.ground.rotation.x = -Math.PI / 2;
    this.ground.receiveShadow = true;
    this.scene.add(this.ground);

    // Add decorative elements
    this.addTrees();
    this.addRocks();
  }

  noise(x, z) {
    // Simple noise function for terrain
    return Math.sin(x) * Math.cos(z) + 
           Math.sin(x * 2) * Math.cos(z * 2) * 0.5;
  }

  setupLighting() {
    // Improved lighting setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(50, 50, 50);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 500;
    this.scene.add(directionalLight);

    // Add hemispheric light for better environmental lighting
    const hemiLight = new THREE.HemisphereLight(0xffffbb, 0x080820, 0.5);
    this.scene.add(hemiLight);
  }

  addTrees() {
    const treeGeometry = new THREE.ConeGeometry(1, 4, 8);
    const treeMaterial = new THREE.MeshStandardMaterial({ color: 0x2d5a27 });
    const trunkGeometry = new THREE.CylinderGeometry(0.2, 0.2, 2, 8);
    const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x4a2f21 });

    for (let i = 0; i < 30; i++) {
      const tree = new THREE.Group();
      
      const leaves = new THREE.Mesh(treeGeometry, treeMaterial);
      leaves.position.y = 3;
      leaves.castShadow = true;
      
      const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
      trunk.position.y = 1;
      trunk.castShadow = true;

      tree.add(trunk);
      tree.add(leaves);

      const x = (Math.random() - 0.5) * 40;
      const z = (Math.random() - 0.5) * 40;
      const y = this.getHeightAt(x, z);
      
      tree.position.set(x, y, z);
      this.scene.add(tree);
    }
  }

  addRocks() {
    const rockGeometry = new THREE.DodecahedronGeometry(1);
    const rockMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x808080,
      roughness: 0.8
    });

    for (let i = 0; i < 20; i++) {
      const rock = new THREE.Mesh(rockGeometry, rockMaterial);
      rock.scale.set(
        Math.random() * 0.5 + 0.5,
        Math.random() * 0.5 + 0.5,
        Math.random() * 0.5 + 0.5
      );
      
      const x = (Math.random() - 0.5) * 40;
      const z = (Math.random() - 0.5) * 40;
      const y = this.getHeightAt(x, z);
      
      rock.position.set(x, y, z);
      rock.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );
      rock.castShadow = true;
      this.scene.add(rock);
    }
  }

  getHeightAt(x, z) {
    // Get height of terrain at given point
    return this.noise(x * 0.1, z * 0.1) * 2;
  }

  setupNavMesh() {
    // Create a simplified navigation mesh for pathfinding
    const geometry = new THREE.PlaneGeometry(50, 50, 10, 10);
    const position = geometry.attributes.position;
    
    // Apply height to vertices
    for (let i = 0; i < position.count; i++) {
      const x = position.getX(i);
      const z = position.getZ(i);
      position.setY(i, this.getHeightAt(x, z));
    }
    
    geometry.computeVertexNormals();
    
    // Create the zone
    const zone = THREE.Pathfinding.createZone(geometry);
    this.pathfinder.setZoneData('world', zone);
    
    // Debug visualization of navmesh (optional)
    const material = new THREE.MeshBasicMaterial({
      color: 0x0000ff,
      wireframe: true,
      opacity: 0.1,
      transparent: true
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = -Math.PI / 2;
    this.scene.add(mesh);
  }

  findPath(start, end) {
    try {
      // Ensure proper Vector3 objects
      const startVec = new THREE.Vector3(start.x, this.getHeightAt(start.x, start.z), start.z);
      const endVec = new THREE.Vector3(end.x, this.getHeightAt(end.x, end.z), end.z);
      
      // Get closest valid points on navmesh
      const startPos = this.pathfinder.getClosestNode(startVec, 'world');
      const endPos = this.pathfinder.getClosestNode(endVec, 'world');
      
      if (!startPos || !endPos) return null;
      
      // Find path
      return this.pathfinder.findPath(startPos, endPos, 'world');
    } catch (error) {
      console.warn('Pathfinding error:', error);
      return null;
    }
  }

  createPetMesh(config) {
    const group = new THREE.Group();

    // Body
    const bodyGeometry = new THREE.BoxGeometry(config.bodySize, config.bodySize, config.bodySize * 1.5);
    const bodyMaterial = new THREE.MeshPhongMaterial({ color: config.bodyColor });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    group.add(body);

    // Head
    const headGeometry = new THREE.SphereGeometry(config.headSize);
    const head = new THREE.Mesh(headGeometry, bodyMaterial);
    head.position.z = config.bodySize * 1.5 / 2 + config.headSize / 2;
    group.add(head);

    // Legs
    const legGeometry = new THREE.CylinderGeometry(0.1, 0.1, config.legLength);
    for (let i = 0; i < 4; i++) {
      const leg = new THREE.Mesh(legGeometry, bodyMaterial);
      leg.position.y = -config.bodySize/2 - config.legLength/2;
      leg.position.x = (i < 2 ? -1 : 1) * config.bodySize/3;
      leg.position.z = (i % 2 ? -1 : 1) * config.bodySize/3;
      group.add(leg);
    }

    // Tail
    const tailGeometry = new THREE.CylinderGeometry(0.1, 0.05, config.tailLength);
    const tail = new THREE.Mesh(tailGeometry, bodyMaterial);
    tail.position.z = -config.bodySize * 1.5 / 2;
    tail.position.y = 0;
    tail.rotation.x = Math.PI / 4;
    group.add(tail);

    return group;
  }

  addPet(pet) {
    const mesh = this.createPetMesh(pet.config);
    mesh.position.set(pet.position.x, pet.position.y, pet.position.z);
    mesh.rotation.set(pet.rotation.x, pet.rotation.y, pet.rotation.z);
    this.scene.add(mesh);
    this.pets.set(pet.id, { mesh, data: pet, targetPosition: null, path: null, pathIndex: 0 });
  }

  removePet(petId) {
    const pet = this.pets.get(petId);
    if (pet) {
      this.scene.remove(pet.mesh);
      this.pets.delete(petId);
    }
  }

  updatePetPosition(petId, position, rotation) {
    const pet = this.pets.get(petId);
    if (pet) {
      pet.mesh.position.set(position.x, position.y, position.z);
      pet.mesh.rotation.set(rotation.x, rotation.y, rotation.z);
    }
  }

  animate() {
    requestAnimationFrame(this.animate);
    
    this.controls.update();
    
    // Animate pets with improved pathfinding
    this.pets.forEach((pet) => {
      const time = Date.now() * 0.001;
      
      // Generate new target position less frequently and with bounds checking
      if (!pet.targetPosition || time % 10 < 0.1) {
        const attempts = 5;
        let validPath = false;
        
        for (let i = 0; i < attempts && !validPath; i++) {
          const targetX = Math.max(-20, Math.min(20, (Math.random() - 0.5) * 40));
          const targetZ = Math.max(-20, Math.min(20, (Math.random() - 0.5) * 40));
          const targetY = this.getHeightAt(targetX, targetZ);
          
          const newTarget = new THREE.Vector3(targetX, targetY, targetZ);
          const path = this.findPath(pet.mesh.position, newTarget);
          
          if (path && path.length > 0) {
            pet.targetPosition = newTarget;
            pet.path = path;
            pet.pathIndex = 0;
            validPath = true;
          }
        }
      }

      // Move along path with smooth transitions
      if (pet.path && pet.path.length > 0 && pet.pathIndex < pet.path.length) {
        const target = pet.path[pet.pathIndex];
        const direction = new THREE.Vector3()
          .subVectors(target, pet.mesh.position)
          .normalize();
        
        // Smooth movement speed
        const speed = 0.05;
        pet.mesh.position.add(direction.multiplyScalar(speed));
        
        // Smooth rotation
        const targetRotation = Math.atan2(direction.x, direction.z);
        const currentRotation = pet.mesh.rotation.y;
        let rotationDiff = targetRotation - currentRotation;
        
        // Normalize rotation difference
        if (rotationDiff > Math.PI) rotationDiff -= Math.PI * 2;
        if (rotationDiff < -Math.PI) rotationDiff += Math.PI * 2;
        
        // Apply smooth rotation
        pet.mesh.rotation.y += rotationDiff * 0.1;
        
        // Check if reached current waypoint
        if (pet.mesh.position.distanceTo(target) < 0.2) {
          pet.pathIndex++;
        }
        
        // Update Y position based on terrain
        pet.mesh.position.y = this.getHeightAt(pet.mesh.position.x, pet.mesh.position.z) + 0.5;
        
        // Broadcast position update
        room.send({
          type: 'petMove',
          petId: pet.data.id,
          position: pet.mesh.position.clone(),
          rotation: pet.mesh.rotation.clone()
        });
      }
    });

    this.renderer.render(this.scene, this.camera);
  }
}