const room = new WebsimSocket();
const world = new PetWorld();

const App = () => {
  const [userPets, setUserPets] = React.useState([]);

  React.useEffect(() => {
    // Load existing pets
    const loadPets = async () => {
      const pets = await room.collection('pets').getList();
      pets.forEach(pet => world.addPet(pet));
      const userPets = pets.filter(pet => pet.username === room.party.client.username);
      setUserPets(userPets);
    };
    loadPets();

    // Subscribe to pet updates
    room.collection('pets').subscribe((pets) => {
      const userPets = pets.filter(pet => pet.username === room.party.client.username);
      setUserPets(userPets);
    });

    // Handle real-time movement updates
    room.onmessage = (event) => {
      const data = event.data;
      if (data.type === 'petMove') {
        world.updatePetPosition(data.petId, data.position, data.rotation);
      }
    };
  }, []);

  const handlePetCreated = (pet) => {
    if (userPets.length >= 3) {
      alert('You can only have up to 3 pets! Please delete one first.');
      return;
    }
    world.addPet(pet);
    setUserPets([...userPets, pet]);
  };

  const handleDeletePet = async (petId) => {
    await room.collection('pets').delete(petId);
    world.removePet(petId);
    setUserPets(userPets.filter(p => p.id !== petId));
  };

  return (
    <div>
      <PetGenerator onPetCreated={handlePetCreated} />
      <div className="pet-list">
        <h3>Your Pets ({userPets.length}/3)</h3>
        {userPets.map(pet => (
          <div key={pet.id}>
            <span>Pet #{pet.id}</span>
            <button onClick={() => handleDeletePet(pet.id)}>Delete</button>
          </div>
        ))}
      </div>
    </div>
  );
};

ReactDOM.render(<App />, document.getElementById('ui-container'));