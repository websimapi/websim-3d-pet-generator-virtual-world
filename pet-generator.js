const PetGenerator = ({ onPetCreated }) => {
  const [petConfig, setPetConfig] = React.useState({
    bodyColor: '#ff0000',
    bodySize: 1,
    headSize: 0.5,
    legLength: 0.5,
    tailLength: 0.3,
    isRandom: false
  });

  const generateRandomPet = () => {
    const config = {
      bodyColor: '#' + Math.floor(Math.random()*16777215).toString(16),
      bodySize: Math.random() * 1.5 + 0.5,
      headSize: Math.random() * 0.7 + 0.3,
      legLength: Math.random() * 0.7 + 0.3,
      tailLength: Math.random() * 0.5 + 0.2,
      isRandom: true
    };
    setPetConfig(config);
    return config;
  };

  const handleCreatePet = async () => {
    const finalConfig = petConfig.isRandom ? generateRandomPet() : petConfig;
    
    const pet = await room.collection('pets').create({
      config: finalConfig,
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 }
    });

    onPetCreated(pet);
  };

  return (
    <div className="generator-container">
      <h2>Pet Generator</h2>
      <div className="control-group">
        <label>Body Color:</label>
        <input 
          type="color" 
          className="color-picker"
          value={petConfig.bodyColor}
          onChange={(e) => setPetConfig({...petConfig, bodyColor: e.target.value})}
        />
      </div>
      <div className="control-group">
        <label>Body Size:</label>
        <input 
          type="range" 
          className="slider"
          min="0.5" 
          max="2" 
          step="0.1"
          value={petConfig.bodySize}
          onChange={(e) => setPetConfig({...petConfig, bodySize: parseFloat(e.target.value)})}
        />
      </div>
      <div className="control-group">
        <label>Head Size:</label>
        <input 
          type="range" 
          className="slider"
          min="0.3" 
          max="1" 
          step="0.1"
          value={petConfig.headSize}
          onChange={(e) => setPetConfig({...petConfig, headSize: parseFloat(e.target.value)})}
        />
      </div>
      <div className="control-group">
        <label>Leg Length:</label>
        <input 
          type="range" 
          className="slider"
          min="0.3" 
          max="1" 
          step="0.1"
          value={petConfig.legLength}
          onChange={(e) => setPetConfig({...petConfig, legLength: parseFloat(e.target.value)})}
        />
      </div>
      <div className="control-group">
        <label>Tail Length:</label>
        <input 
          type="range" 
          className="slider"
          min="0.2" 
          max="0.7" 
          step="0.1"
          value={petConfig.tailLength}
          onChange={(e) => setPetConfig({...petConfig, tailLength: parseFloat(e.target.value)})}
        />
      </div>
      <button className="randomize-btn" onClick={() => setPetConfig(generateRandomPet())}>
        Randomize
      </button>
      <button onClick={handleCreatePet}>Create Pet</button>
    </div>
  );
};