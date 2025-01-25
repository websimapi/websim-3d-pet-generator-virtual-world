class PetWorld {
  constructor() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(this.renderer.domElement);
    
    this.camera.position.z = 5;
    this.camera.position.y = 2;
    this.camera.lookAt(0, 0, 0);
    
    // Add ground plane
    const groundGeometry = new THREE.PlaneGeometry(20, 20);
    const groundMaterial = new THREE.MeshBasicMaterial({ color: 0x90EE90, side: THREE.DoubleSide });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = Math.PI / 2;
    this.scene.add(ground);

    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);

    // Add directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(5, 5, 5);
    this.scene.add(directionalLight);

    this.pets = new Map();
    this.animate = this.animate.bind(this);
    this.animate();

    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
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
    this.pets.set(pet.id, { mesh, data: pet });
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
    
    // Animate pets
    this.pets.forEach((pet) => {
      // Add some random movement
      const time = Date.now() * 0.001;
      const position = {
        x: Math.sin(time + parseInt(pet.data.id)) * 3,
        y: pet.data.position.y,
        z: Math.cos(time + parseInt(pet.data.id)) * 3
      };
      const rotation = {
        x: pet.data.rotation.x,
        y: time + parseInt(pet.data.id),
        z: pet.data.rotation.z
      };
      
      // Update position in world
      this.updatePetPosition(pet.data.id, position, rotation);
      
      // Broadcast position update
      room.send({
        type: 'petMove',
        petId: pet.data.id,
        position,
        rotation
      });
    });

    this.renderer.render(this.scene, this.camera);
  }
}