import React, { useState, useEffect, useRef } from 'react';
import './App.css';

// Функция для проверки границ
function checkBoundaries(organism) {
  organism.x = Math.max(10, Math.min(1290, organism.x));
  organism.y = Math.max(10, Math.min(830, organism.y));
}

// Функция для зигзагообразного побега
function zigzagEscape(organism) {
  if (organism.escapeTimer % 5 === 0) {
    organism.escapeAngle += (Math.random() - 0.5) * Math.PI / 2;
  }
  
  organism.x += Math.cos(organism.escapeAngle) * organism.speed * 1.5;
  organism.y += Math.sin(organism.escapeAngle) * organism.speed * 1.5;
  
  checkBoundaries(organism);
  organism.escapeTimer--;
  organism.energy -= 0.25;
  
  if (organism.escapeTimer <= 0) {
    organism.escapeMode = false;
  }
}

// Классы организмов
class Herbivore {
  constructor(id, x, y) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.size = 10;
    this.maxSize = 20;
    this.speed = 1 + Math.random() * 2;
    this.energy = 100;
    this.type = 'herbivore';
    this.color = `hsl(120, 70%, 50%)`;
    this.eatenCount = 0;
    this.isAdult = false;
    this.reproductionCooldown = 0;
    this.lifespan = 300 + Math.floor(Math.random() * 100);
    this.age = 0;
    this.reproductionDeathChance = 0.1;
    this.escapeMode = false;
    this.escapeTimer = 0;
    this.escapeAngle = 0;
  }

  findMate(herbivores) {
    if (!this.isAdult || this.reproductionCooldown > 0) return null;
    
    let closestMate = null;
    let minDist = Infinity;
    
    herbivores.forEach(mate => {
      if (mate.id === this.id || !mate.isAdult || mate.reproductionCooldown > 0) return;
      
      const dx = mate.x - this.x;
      const dy = mate.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < minDist && dist < 250) {
        minDist = dist;
        closestMate = mate;
      }
    });
    
    return closestMate;
  }

  checkDanger(predators, omnivores) {
    for (const predator of predators) {
      const dx = predator.x - this.x;
      const dy = predator.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < 150 && !this.escapeMode) {
        this.escapeMode = true;
        this.escapeTimer = 30 + Math.floor(Math.random() * 20);
        this.escapeAngle = Math.atan2(this.y - predator.y, this.x - predator.x);
        return true;
      }
    }
    
    for (const omnivore of omnivores) {
      if (omnivore.isAdult) {
        const dx = omnivore.x - this.x;
        const dy = omnivore.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < 150 && !this.escapeMode) {
          this.escapeMode = true;
          this.escapeTimer = 30 + Math.floor(Math.random() * 20);
          this.escapeAngle = Math.atan2(this.y - omnivore.y, this.x - omnivore.x);
          return true;
        }
      }
    }
    
    return false;
  }

  move(plants, herbivores, predators, omnivores) {
    if (this.escapeMode) {
      zigzagEscape(this);
      return;
    }
    
    if (this.reproductionCooldown > 0) this.reproductionCooldown--;
    
    // Проверка опасности
    if (this.checkDanger(predators, omnivores)) {
      return;
    }
    
    const mate = this.isAdult ? this.findMate(herbivores) : null;
    let closestPlant = null;
    let minDist = Infinity;
    
    plants.forEach(plant => {
      const dx = plant.x - this.x;
      const dy = plant.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < minDist && dist < 200) {
        minDist = dist;
        closestPlant = plant;
      }
    });
    
    if (mate) {
      const angle = Math.atan2(mate.y - this.y, mate.x - this.x);
      this.x += Math.cos(angle) * this.speed;
      this.y += Math.sin(angle) * this.speed;
    } else if (closestPlant) {
      const angle = Math.atan2(closestPlant.y - this.y, closestPlant.x - this.x);
      this.x += Math.cos(angle) * this.speed;
      this.y += Math.sin(angle) * this.speed;
    } else {
      this.x += (Math.random() - 0.5) * this.speed * 2;
      this.y += (Math.random() - 0.5) * this.speed * 2;
    }
    
    checkBoundaries(this);
    this.energy -= 0.1;
  }
  
  eat(plants) {
    for (let i = 0; i < plants.length; i++) {
      const plant = plants[i];
      const dx = plant.x - this.x;
      const dy = plant.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < this.size + plant.size) {
        this.energy += 30;
        this.eatenCount++;
        
        if (!this.isAdult && this.eatenCount >= 3) {
          this.isAdult = true;
          this.size = this.maxSize;
        }
        
        return i;
      }
    }
    return -1;
  }
  
  reproduce(other) {
    if (!this.isAdult || !other?.isAdult || 
        this.reproductionCooldown > 0 || 
        other.reproductionCooldown > 0) {
      return null;
    }

    const cooldowns = {
      herbivore: 60,
      predator: 80,
      omnivore: 70
    };
    
    this.reproductionCooldown = cooldowns[this.type];
    other.reproductionCooldown = cooldowns[this.type];

    const killParent = (org) => {
      if (Math.random() < org.reproductionDeathChance) {
        org.energy = 0;
        return true;
      }
      return false;
    };

    const parent1Died = killParent(this);
    const parent2Died = killParent(other);

    if (!parent1Died || !parent2Died) {
      return new this.constructor(
        Date.now(),
        (this.x + other.x) / 2 + (Math.random() - 0.5) * 30,
        (this.y + other.y) / 2 + (Math.random() - 0.5) * 30
      );
    }
    
    return null;
  }
}

class Predator {
  constructor(id, x, y) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.size = 10;
    this.maxSize = 20;
    this.speed = 1.5 + Math.random() * 2;
    this.energy = 100;
    this.type = 'predator';
    this.color = `hsl(0, 80%, 50%)`;
    this.eatenCount = 0;
    this.isAdult = false;
    this.reproductionCooldown = 0;
    this.lifespan = 200 + Math.floor(Math.random() * 50);
    this.age = 0;
    this.reproductionDeathChance = 0.2;
    this.escapeMode = false;
    this.escapeTimer = 0;
    this.escapeAngle = 0;
  }

  findMate(predators) {
    if (!this.isAdult || this.reproductionCooldown > 0) return null;
    
    let closestMate = null;
    let minDist = Infinity;
    
    predators.forEach(mate => {
      if (mate.id === this.id || !mate.isAdult || mate.reproductionCooldown > 0) return;
      
      const dx = mate.x - this.x;
      const dy = mate.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < minDist && dist < 250) {
        minDist = dist;
        closestMate = mate;
      }
    });
    
    return closestMate;
  }

  checkDanger(omnivores) {
    for (const omnivore of omnivores) {
      if (omnivore.isAdult) {
        const dx = omnivore.x - this.x;
        const dy = omnivore.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < 150 && !this.escapeMode && !this.isAdult) {
          this.escapeMode = true;
          this.escapeTimer = 30 + Math.floor(Math.random() * 20);
          this.escapeAngle = Math.atan2(this.y - omnivore.y, this.x - omnivore.x);
          return true;
        }
      }
    }
    return false;
  }

  move(herbivores, omnivores, predators) {
    if (this.escapeMode) {
      zigzagEscape(this);
      return;
    }
    
    if (this.reproductionCooldown > 0) this.reproductionCooldown--;
    
    // Проверка опасности (только для молодых хищников)
    if (!this.isAdult && this.checkDanger(omnivores)) {
      return;
    }
    
    const mate = this.isAdult ? this.findMate(predators) : null;
    let closestPrey = null;
    let minDist = Infinity;
    
    herbivores.forEach(prey => {
      const dx = prey.x - this.x;
      const dy = prey.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < minDist && dist < 300) {
        minDist = dist;
        closestPrey = prey;
      }
    });
    
    omnivores.forEach(prey => {
      const dx = prey.x - this.x;
      const dy = prey.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < minDist && dist < 300) {
        minDist = dist;
        closestPrey = prey;
      }
    });
    
    if (mate) {
      const angle = Math.atan2(mate.y - this.y, mate.x - this.x);
      this.x += Math.cos(angle) * this.speed;
      this.y += Math.sin(angle) * this.speed;
    } else if (closestPrey) {
      const angle = Math.atan2(closestPrey.y - this.y, closestPrey.x - this.x);
      this.x += Math.cos(angle) * this.speed;
      this.y += Math.sin(angle) * this.speed;
    } else {
      this.x += (Math.random() - 0.5) * this.speed * 2;
      this.y += (Math.random() - 0.5) * this.speed * 2;
    }
    
    checkBoundaries(this);
    this.energy -= 0.15;
  }
  
  eat(herbivores, omnivores) {
    for (let i = 0; i < herbivores.length; i++) {
      const prey = herbivores[i];
      const dx = prey.x - this.x;
      const dy = prey.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < this.size + prey.size) {
        this.energy += 50;
        this.eatenCount++;
        
        if (!this.isAdult && this.eatenCount >= 5) {
          this.isAdult = true;
          this.size = this.maxSize;
        }
        
        return { type: 'herbivore', index: i };
      }
    }
    
    for (let i = 0; i < omnivores.length; i++) {
      const prey = omnivores[i];
      const dx = prey.x - this.x;
      const dy = prey.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < this.size + prey.size) {
        this.energy += 50;
        this.eatenCount++;
        
        if (!this.isAdult && this.eatenCount >= 5) {
          this.isAdult = true;
          this.size = this.maxSize;
        }
        
        return { type: 'omnivore', index: i };
      }
    }
    
    return null;
  }

  reproduce(other) {
    if (!this.isAdult || !other?.isAdult || 
        this.reproductionCooldown > 0 || 
        other.reproductionCooldown > 0) {
      return null;
    }

    const cooldowns = {
      herbivore: 60,
      predator: 80,
      omnivore: 70
    };
    
    this.reproductionCooldown = cooldowns[this.type];
    other.reproductionCooldown = cooldowns[this.type];

    const killParent = (org) => {
      if (Math.random() < org.reproductionDeathChance) {
        org.energy = 0;
        return true;
      }
      return false;
    };

    const parent1Died = killParent(this);
    const parent2Died = killParent(other);

    if (!parent1Died || !parent2Died) {
      return new this.constructor(
        Date.now(),
        (this.x + other.x) / 2 + (Math.random() - 0.5) * 30,
        (this.y + other.y) / 2 + (Math.random() - 0.5) * 30
      );
    }
    
    return null;
  }
}

class Omnivore {
  constructor(id, x, y) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.size = 10;
    this.maxSize = 15;
    this.speed = 1.2 + Math.random() * 2;
    this.energy = 100;
    this.type = 'omnivore';
    this.color = `hsl(240, 80%, 60%)`;
    this.eatenCount = 0;
    this.isAdult = false;
    this.reproductionCooldown = 0;
    this.lifespan = 250 + Math.floor(Math.random() * 70);
    this.age = 0;
    this.reproductionDeathChance = 0.15;
    this.escapeMode = false;
    this.escapeTimer = 0;
    this.escapeAngle = 0;
  }

  findMate(omnivores) {
    if (!this.isAdult || this.reproductionCooldown > 0) return null;
    
    let closestMate = null;
    let minDist = Infinity;
    
    omnivores.forEach(mate => {
      if (mate.id === this.id || !mate.isAdult || mate.reproductionCooldown > 0) return;
      
      const dx = mate.x - this.x;
      const dy = mate.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < minDist && dist < 250) {
        minDist = dist;
        closestMate = mate;
      }
    });
    
    return closestMate;
  }

  checkDanger(predators) {
    for (const predator of predators) {
      const dx = predator.x - this.x;
      const dy = predator.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < 150 && !this.escapeMode && !this.isAdult) {
        this.escapeMode = true;
        this.escapeTimer = 30 + Math.floor(Math.random() * 20);
        this.escapeAngle = Math.atan2(this.y - predator.y, this.x - predator.x);
        return true;
      }
    }
    return false;
  }

  move(plants, herbivores, predators, omnivores) {
    if (this.escapeMode) {
      zigzagEscape(this);
      return;
    }
    
    if (this.reproductionCooldown > 0) this.reproductionCooldown--;
    
    // Проверка опасности (только для молодых всеядных)
    if (!this.isAdult && this.checkDanger(predators)) {
      return;
    }
    
    const mate = this.isAdult ? this.findMate(omnivores) : null;
    let closestFood = null;
    let minDist = Infinity;

    plants.forEach(plant => {
      const dx = plant.x - this.x;
      const dy = plant.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < minDist && dist < 150) {
        minDist = dist;
        closestFood = plant;
      }
    });
    
    herbivores.forEach(prey => {
      const dx = prey.x - this.x;
      const dy = prey.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < minDist && dist < 200) {
        minDist = dist;
        closestFood = prey;
      }
    });
    
    if (this.isAdult) {
      predators.forEach(predator => {
        if (!predator.isAdult) {
          const dx = predator.x - this.x;
          const dy = predator.y - this.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          if (dist < minDist && dist < 200) {
            minDist = dist;
            closestFood = predator;
          }
        }
      });
    }
    
    if (mate) {
      const angle = Math.atan2(mate.y - this.y, mate.x - this.x);
      this.x += Math.cos(angle) * this.speed;
      this.y += Math.sin(angle) * this.speed;
    } else if (closestFood) {
      const angle = Math.atan2(closestFood.y - this.y, closestFood.x - this.x);
      this.x += Math.cos(angle) * this.speed;
      this.y += Math.sin(angle) * this.speed;
    } else {
      this.x += (Math.random() - 0.5) * this.speed * 2;
      this.y += (Math.random() - 0.5) * this.speed * 2;
    }
    
    checkBoundaries(this);
    this.energy -= 0.12;
  }
  
  eat(plants, herbivores, predators) {
    for (let i = 0; i < herbivores.length; i++) {
      const prey = herbivores[i];
      const dx = prey.x - this.x;
      const dy = prey.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < this.size + prey.size) {
        this.energy += 40;
        this.eatenCount++;
        
        if (!this.isAdult && this.eatenCount >= 7) {
          this.isAdult = true;
          this.size = this.maxSize;
        }
        
        return { type: 'herbivore', index: i };
      }
    }
    
    if (this.isAdult) {
      for (let i = 0; i < predators.length; i++) {
        const predator = predators[i];
        if (!predator.isAdult) {
          const dx = predator.x - this.x;
          const dy = predator.y - this.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          if (dist < this.size + predator.size) {
            this.energy += 45;
            this.eatenCount++;
            
            if (!this.isAdult && this.eatenCount >= 7) {
              this.isAdult = true;
              this.size = this.maxSize;
            }
            
            return { type: 'predator', index: i };
          }
        }
      }
    }
    
    for (let i = 0; i < plants.length; i++) {
      const plant = plants[i];
      const dx = plant.x - this.x;
      const dy = plant.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < this.size + plant.size) {
        this.energy += 25;
        this.eatenCount++;
        
        if (!this.isAdult && this.eatenCount >= 10) {
          this.isAdult = true;
          this.size = this.maxSize;
        }
        
        return { type: 'plant', index: i };
      }
    }
    
    return null;
  }
  
  reproduce(other) {
    if (!this.isAdult || !other?.isAdult || 
        this.reproductionCooldown > 0 || 
        other.reproductionCooldown > 0) {
      return null;
    }

    const cooldowns = {
      herbivore: 60,
      predator: 80,
      omnivore: 70
    };
    
    this.reproductionCooldown = cooldowns[this.type];
    other.reproductionCooldown = cooldowns[this.type];

    const killParent = (org) => {
      if (Math.random() < org.reproductionDeathChance) {
        org.energy = 0;
        return true;
      }
      return false;
    };

    const parent1Died = killParent(this);
    const parent2Died = killParent(other);

    if (!parent1Died || !parent2Died) {
      return new this.constructor(
        Date.now(),
        (this.x + other.x) / 2 + (Math.random() - 0.5) * 30,
        (this.y + other.y) / 2 + (Math.random() - 0.5) * 30
      );
    }
    
    return null;
  }
}

class Plant {
  constructor(id, x, y) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.size = 6 + Math.random() * 4;
    this.type = 'plant';
    this.color = `hsl(90, 80%, 30%)`;
  }
}
class Pollution {
  constructor(id, x, y) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.size = 20;
    this.maxSize = 200;
    this.currentSize = 0; // Начинаем с 0 и увеличиваем
    this.growthRate = 1;
    this.lifetime = 500; // Время жизни в кадрах
    this.age = 0;
    this.fadeStart = 300; // Когда начинать исчезать
    this.color = 'rgba(0, 0, 0, 0.7)';
    this.isActive = true;
  }

  update() {
    if (!this.isActive) return;

    this.age++;
    
    // Фаза роста
    if (this.currentSize < this.maxSize && this.age < this.fadeStart) {
      this.currentSize = Math.min(this.maxSize, this.currentSize + this.growthRate);
    }
    // Фаза исчезновения
    else if (this.age >= this.fadeStart) {
      const fadeProgress = (this.age - this.fadeStart) / (this.lifetime - this.fadeStart);
      this.currentSize = this.maxSize * (1 - fadeProgress);
      
      if (this.age >= this.lifetime) {
        this.isActive = false;
      }
    }
  }

  isPointInside(x, y) {
    if (!this.isActive) return false;
    const dx = x - this.x;
    const dy = y - this.y;
    return Math.sqrt(dx * dx + dy * dy) < this.currentSize;
  }
}

function UnderwaterEvolution() {
  const canvasRef = useRef(null);
  const [organisms, setOrganisms] = useState([]);
  const [plants, setPlants] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [speedMultiplier, setSpeedMultiplier] = useState(1);
  const [stats, setStats] = useState({
    herbivores: 0,
    predators: 0,
    omnivores: 0,
    plants: 0,
    generation: 0
  });
  
  const [addCounts, setAddCounts] = useState({
    herbivore: 1,
    predator: 1,
    omnivore: 1,
    plant: 1
  });

  const baseSpeed = 100;

  const [pollutions, setPollutions] = useState([]);
const addPollution = () => {
  const newPollution = new Pollution(
    Date.now(),
    Math.random() * 1200 + 50,
    Math.random() * 700 + 50
  );
  setPollutions(prev => [...prev, newPollution]);
};

  useEffect(() => {
    resetSimulation();
  }, []);

 const resetSimulation = () => {
  const initialOrganisms = [];
  for (let i = 0; i < 5; i++) {
    initialOrganisms.push(new Herbivore(i, Math.random() * 1300, Math.random() * 840));
  }
  for (let i = 5; i < 10; i++) {
    initialOrganisms.push(new Predator(i, Math.random() * 1300, Math.random() * 840));
  }
  for (let i = 10; i < 15; i++) {
    initialOrganisms.push(new Omnivore(i, Math.random() * 1300, Math.random() * 840));
  }
  
  const initialPlants = [];
  for (let i = 0; i < 20; i++) {
    initialPlants.push(new Plant(i, Math.random() * 1300, Math.random() * 840));
  }
  
  setOrganisms(initialOrganisms);
  setPlants(initialPlants);
  setPollutions([]); // Добавьте эту строку для очистки загрязнений
  setStats({
    herbivores: 5,
    predators: 5,
    omnivores: 5,
    plants: 20,
    generation: 0
  });
  setIsRunning(false);
};
  const addOrganism = (type) => {
    const count = addCounts[type];
    const newOrganisms = [];
    
    for (let i = 0; i < count; i++) {
      const newOrganism = (() => {
        switch(type) {
          case 'herbivore':
            return new Herbivore(Date.now() + i, Math.random() * 1300, Math.random() * 840);
          case 'predator':
            return new Predator(Date.now() + i, Math.random() * 1300, Math.random() * 840);
          case 'omnivore':
            return new Omnivore(Date.now() + i, Math.random() * 1300, Math.random() * 840);
          default:
            return null;
        }
      })();
      
      if (newOrganism) {
        newOrganisms.push(newOrganism);
      }
    }
    
    setOrganisms(prev => [...prev, ...newOrganisms]);
    setStats(prev => ({
      ...prev,
      [type + 's']: prev[type + 's'] + count
    }));
  };

  const addPlant = () => {
    const count = addCounts.plant;
    const newPlants = [];
    
    for (let i = 0; i < count; i++) {
      newPlants.push(new Plant(Date.now() + i, Math.random() * 1300, Math.random() * 840));
    }
    
    setPlants(prev => [...prev, ...newPlants]);
    setStats(prev => ({
      ...prev,
      plants: prev.plants + count
    }));
  };

  useEffect(() => {
  if (!isRunning) return;
  
  const actualSpeed = baseSpeed / speedMultiplier;
  
  const gameLoop = setInterval(() => {
    setOrganisms(prevOrganisms => {
      const newOrganisms = prevOrganisms.map(org => {
        let newOrg;
        if (org.type === 'herbivore') {
          newOrg = new Herbivore(org.id, org.x, org.y);
        } else if (org.type === 'predator') {
          newOrg = new Predator(org.id, org.x, org.y);
        } else if (org.type === 'omnivore') {
          newOrg = new Omnivore(org.id, org.x, org.y);
        }
        
        if (newOrg) {
          newOrg.energy = org.energy;
          newOrg.eatenCount = org.eatenCount;
          newOrg.isAdult = org.isAdult;
          newOrg.reproductionCooldown = org.reproductionCooldown;
          newOrg.escapeMode = org.escapeMode;
          newOrg.escapeTimer = org.escapeTimer;
          newOrg.escapeAngle = org.escapeAngle;
          return newOrg;
        }
        return org;
      });
      
      const newPlants = [...plants];
      const organismsToAdd = [];
      
      const herbivores = newOrganisms.filter(o => o.type === 'herbivore');
      const predators = newOrganisms.filter(o => o.type === 'predator');
      const omnivores = newOrganisms.filter(o => o.type === 'omnivore');
      
      for (const organism of newOrganisms) {
        if (organism.energy <= 0) continue;
        
        if (organism.type === 'herbivore') {
          organism.move(newPlants, herbivores, predators, omnivores);
          const eatenIndex = organism.eat(newPlants);
          if (eatenIndex !== -1) {
            newPlants.splice(eatenIndex, 1);
          }
        } else if (organism.type === 'predator') {
          organism.move(herbivores, omnivores, predators);
          const eaten = organism.eat(herbivores, omnivores);
          if (eaten) {
            const preyArray = eaten.type === 'herbivore' ? herbivores : omnivores;
            const preyId = preyArray[eaten.index].id;
            const preyIndex = newOrganisms.findIndex(o => o.id === preyId);
            if (preyIndex !== -1) {
              newOrganisms[preyIndex].energy = 0;
            }
          }
        } else if (organism.type === 'omnivore') {
          organism.move(newPlants, herbivores, predators, omnivores);
          const eaten = organism.eat(newPlants, herbivores, predators);
          if (eaten) {
            if (eaten.type === 'plant') {
              newPlants.splice(eaten.index, 1);
            } else {
              const preyArray = eaten.type === 'herbivore' ? herbivores : 
                              eaten.type === 'predator' ? predators : null;
              if (preyArray) {
                const preyId = preyArray[eaten.index].id;
                const preyIndex = newOrganisms.findIndex(o => o.id === preyId);
                if (preyIndex !== -1) {
                  newOrganisms[preyIndex].energy = 0;
                }
              }
            }
          }
        }
      }
      
      for (let i = 0; i < newOrganisms.length; i++) {
        const org1 = newOrganisms[i];
        if (org1.energy <= 0 || !org1.isAdult) continue;
        
        for (let j = i + 1; j < newOrganisms.length; j++) {
          const org2 = newOrganisms[j];
          if (org2.energy <= 0 || !org2.isAdult || org1.type !== org2.type) continue;
          
          const dx = org1.x - org2.x;
          const dy = org1.y - org2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          if (dist < org1.size + org2.size) {
            const offspring = org1.reproduce(org2);
            if (offspring) {
              organismsToAdd.push(offspring);
            }
          }
        }
      }
      
      // Обновляем загрязнения
      const updatedPollutions = pollutions
        .map(p => {
          const newP = new Pollution(p.id, p.x, p.y);
          Object.assign(newP, p);
          newP.update();
          return newP;
        })
        .filter(p => p.isActive);
      
      // Проверяем влияние загрязнений на растения
      const updatedPlants = newPlants.filter(plant => {
        return !updatedPollutions.some(pollution => 
          pollution.isPointInside(plant.x, plant.y)
        );
      });
      
      // Проверяем влияние загрязнений на организмы
      const updatedOrganisms = [...newOrganisms, ...organismsToAdd]
        .filter(organism => {
          if (organism.energy <= 0) return false;
          
          return !updatedPollutions.some(pollution => pollution.isPointInside(organism.x, organism.y));
        });
      
      setPlants(updatedPlants);
      setPollutions(updatedPollutions);
      
      setStats(prev => ({
        ...prev,
        herbivores: updatedOrganisms.filter(o => o.type === 'herbivore').length,
        predators: updatedOrganisms.filter(o => o.type === 'predator').length,
        omnivores: updatedOrganisms.filter(o => o.type === 'omnivore').length,
        plants: updatedPlants.length,
        generation: prev.generation + 1
      }));
      
      return updatedOrganisms;
    });
  }, actualSpeed);

  return () => clearInterval(gameLoop);
}, [isRunning, speedMultiplier, plants, pollutions]);

const renderScene = () => {
  const canvas = canvasRef.current;
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, 1300, 840);
  
  ctx.fillStyle = '#5c9eee';
  ctx.fillRect(0, 0, 1300, 840);
  
  // Рисуем загрязнения
  pollutions.forEach(pollution => {
    if (!pollution.isActive) return;
    
    const gradient = ctx.createRadialGradient(
      pollution.x, pollution.y, 0,
      pollution.x, pollution.y, pollution.currentSize
    );
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0.8)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0.1)');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(
      pollution.x, 
      pollution.y, 
      pollution.currentSize, 
      0, 
      Math.PI * 2
    );
    ctx.fill();
  });
  
  plants.forEach(plant => {
    ctx.fillStyle = plant.color;
    ctx.beginPath();
    ctx.arc(plant.x, plant.y, plant.size, 0, Math.PI * 2);
    ctx.fill();
  });
  
  organisms.forEach(organism => {
    ctx.fillStyle = organism.color;
    ctx.beginPath();
    ctx.arc(organism.x, organism.y, organism.size, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(
      organism.x - organism.size * 0.3, 
      organism.y - organism.size * 0.2, 
      organism.size * 0.3, 
      0, 
      Math.PI * 2
    );
    ctx.arc(
      organism.x + organism.size * 0.3, 
      organism.y - organism.size * 0.2, 
      organism.size * 0.3, 
      0, 
      Math.PI * 2
    );
    ctx.fill();
    
    ctx.fillStyle = 'black';
    ctx.beginPath();
    ctx.arc(
      organism.x - organism.size * 0.3, 
      organism.y - organism.size * 0.2, 
      organism.size * 0.15, 
      0, 
      Math.PI * 2
    );
    ctx.arc(
      organism.x + organism.size * 0.3, 
      organism.y - organism.size * 0.2, 
      organism.size * 0.15, 
      0, 
      Math.PI * 2
    );
    ctx.fill();
    
    if (organism.isAdult) {
      ctx.strokeStyle = 'gold';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(organism.x, organism.y, organism.size + 3, 0, Math.PI * 2);
      ctx.stroke();
    }
  });
};

  useEffect(() => {
    renderScene();
  }, [organisms, plants]);

  return (
    <div className="evolution-simulator">
      <h1>Эволюция Подводного Мира</h1>
      
      <div className="simulation-container">
        <div className="stats-panel">
          <h2>Статистика</h2>
          <p>Поколение: {stats.generation}</p>
          <p>Травоядные: {stats.herbivores}</p>
          <p>Хищники: {stats.predators}</p>
          <p>Всеядные: {stats.omnivores}</p>
          <p>Растения: {stats.plants}</p>
        </div>

        <canvas 
          ref={canvasRef} 
          width={1300}
          height={840} 
          className="simulation-canvas"
        />

        <div className="controls-panel">
          <div className="speed-control">
            <h2>Скорость: {speedMultiplier}x</h2>
            <input 
              type="range" 
              min="0.25" 
              max="4" 
              step="0.25"
              value={speedMultiplier} 
              onChange={(e) => setSpeedMultiplier(parseFloat(e.target.value))} 
            />
          </div>
          
          <div className="add-organisms">
            <h2>Добавить</h2>
            
            <div className="add-control">
              <input 
                type="number" 
                min="1" 
                max="100"
                value={addCounts.herbivore}
                onChange={(e) => setAddCounts(prev => ({
                  ...prev,
                  herbivore: Math.max(1, parseInt(e.target.value) || 1)
                }))}
              />
              <button onClick={() => addOrganism('herbivore')}>Травоядное</button>
            </div>
            
            <div className="add-control">
              <input 
                type="number" 
                min="1" 
                max="100"
                value={addCounts.predator}
                onChange={(e) => setAddCounts(prev => ({
                  ...prev,
                  predator: Math.max(1, parseInt(e.target.value) || 1)
                }))}
              />
              <button onClick={() => addOrganism('predator')}>Хищник</button>
            </div>
            
            <div className="add-control">
              <input 
                type="number" 
                min="1" 
                max="100"
                value={addCounts.omnivore}
                onChange={(e) => setAddCounts(prev => ({
                  ...prev,
                  omnivore: Math.max(1, parseInt(e.target.value) || 1)
                }))}
              />
              <button onClick={() => addOrganism('omnivore')}>Всеядное</button>
            </div>
            
            <div className="add-control">
              <input 
                type="number" 
                min="1" 
                max="100"
                value={addCounts.plant}
                onChange={(e) => setAddCounts(prev => ({
                  ...prev,
                  plant: Math.max(1, parseInt(e.target.value) || 1)
                }))}
              />
              <button onClick={addPlant}>Растение</button>
            </div>
            <div className="add-control">
  <button 
    onClick={addPollution}  >
    Загрязнение
  </button>
</div>
          </div>
          
          <div className="simulation-controls">
            <h2>Управление</h2>
            <button onClick={() => setIsRunning(!isRunning)}>
              {isRunning ? 'Пауза' : 'Старт'}
            </button>
            <button onClick={resetSimulation}>Сбросить</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UnderwaterEvolution;
