import React, { useState, useEffect, useRef } from 'react';
import './App.css';
const FIELD_WIDTH = 1300;
const FIELD_HEIGHT = 840;
const MARGIN = 10; // Отступ от края

// Функция проверки границ (добавить после констант)
function checkBoundaries(organism) {
  organism.x = Math.max(MARGIN + organism.size, 
               Math.min(FIELD_WIDTH - MARGIN - organism.size, organism.x));
  organism.y = Math.max(MARGIN + organism.size, 
               Math.min(FIELD_HEIGHT - MARGIN - organism.size, organism.y));
}

// Функция для зигзагообразного побега
function zigzagEscape(organism) {
  if (organism.escapeTimer % 5 === 0) {
    organism.escapeAngle += (Math.random() - 0.5) * Math.PI / 2;
  }
  
checkBoundaries(organism);

  organism.escapeTimer--;
  organism.energy -= 0.25;
  
  if (organism.escapeTimer <= 0) {
    organism.escapeMode = false;
  }
}

// Функция поиска укрытия (растения)
function findShelter(organism, plants) {
  let closestShelter = null;
  let minDist = Infinity;
  
  plants.forEach(plant => {
    const dx = plant.x - organism.x;
    const dy = plant.y - organism.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    // Ищем растения достаточно большие и близкие
    if (dist < minDist && dist < 200 && plant.size >= organism.size) {
      minDist = dist;
      closestShelter = plant;
    }
  });
  
  return closestShelter;
}

class Herbivore {
  constructor(id, x, y) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.size = 10;
    this.maxSize = 10;
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
    this.escapeAngle = 0;
    this.escapeMode = false;
    this.escapeTimer = 0;
    this.shelterFound = false;
    this.currentShelter = null; // Текущее укрытие
     this.hidden = false; // Спрятан ли организм
    this.hideStartTime = 0; // Время начала укрытия
    this.hideDuration = 10000; // 10 секунд в миллисекундах
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

  detectPredators(predators, omnivores) {
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
      const dx = omnivore.x - this.x;
      const dy = omnivore.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < 120 && !this.escapeMode) {
        this.escapeMode = true;
        this.escapeTimer = 20 + Math.floor(Math.random() * 15);
        this.escapeAngle = Math.atan2(this.y - omnivore.y, this.x - omnivore.x);
        return true;
      }
    }
    
    return false;
  }

   move(plants, herbivores, predators, omnivores) {
    if (this.reproductionCooldown > 0) this.reproductionCooldown--;
    
    // Проверяем, не истекло ли время укрытия
    if (this.hidden && Date.now() - this.hideStartTime > this.hideDuration) {
      this.hidden = false;
      this.currentShelter = null;
    }
    
     this.detectPredators(predators, omnivores);
    
    if (this.escapeMode) {
      if (!this.currentShelter) {
        this.currentShelter = findShelter(this, plants);
      }
      
      if (this.currentShelter) {
        // Проверяем, не занято ли укрытие другим травоядным
        const shelterOccupied = herbivores.some(h => 
          h !== this && h.currentShelter && h.currentShelter.id === this.currentShelter.id
        );
        
        if (!shelterOccupied) {
          // Двигаемся к укрытию
          const angle = Math.atan2(
            this.currentShelter.y - this.y, 
            this.currentShelter.x - this.x
          );
          this.x += Math.cos(angle) * this.speed * 1.2;
          this.y += Math.sin(angle) * this.speed * 1.2;
          
          // Проверяем, достигли ли укрытия
          const dx = this.currentShelter.x - this.x;
          const dy = this.currentShelter.y - this.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          if (dist < this.currentShelter.size + this.size) {
            this.hidden = true;
            this.hideStartTime = Date.now();
            this.escapeMode = false;
          }
        } else {
          // Укрытие занято - ищем другое или убегаем
          this.currentShelter = null;
          zigzagEscape(this);
        }
        return;
      } else {
        zigzagEscape(this);
        return;
      }
    }
    
    // Остальная логика движения, если не в режиме побега
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

 eat(plants) {  // This method was incorrectly placed outside the class
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
    this.maxSize = 10;
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

  move(herbivores, omnivores, predators) {
    if (this.reproductionCooldown > 0) this.reproductionCooldown--;
    
    const mate = this.isAdult ? this.findMate(predators) : null;
    let closestPrey = null;
    let minDist = Infinity;
    
    // Ищем ближайшую видимую добычу (не спрятанную)
    herbivores.forEach(prey => {
      if (prey.hidden) return; // Пропускаем спрятанную добычу
      
      const dx = prey.x - this.x;
      const dy = prey.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < minDist && dist < 300) {
        minDist = dist;
        closestPrey = prey;
      }
    });
    
    omnivores.forEach(prey => {
      if (prey.hidden) return; // Пропускаем спрятанную добычу
      
      const dx = prey.x - this.x;
      const dy = prey.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < minDist && dist < 300) {
        minDist = dist;
        closestPrey = prey;
      }
    });
    
    // Если добыча спряталась, ищем другую цель
    if (closestPrey && closestPrey.hidden) {
      closestPrey = null;
    }
    
    if (mate) {
      // Двигаемся к партнеру для размножения
      const angle = Math.atan2(mate.y - this.y, mate.x - this.x);
      this.x += Math.cos(angle) * this.speed;
      this.y += Math.sin(angle) * this.speed;
    } else if (closestPrey) {
      // Атакуем добычу
      const angle = Math.atan2(closestPrey.y - this.y, closestPrey.x - this.x);
      this.x += Math.cos(angle) * this.speed;
      this.y += Math.sin(angle) * this.speed;
    } else {
      // Случайное движение, если нет целей
      this.x += (Math.random() - 0.5) * this.speed * 2;
      this.y += (Math.random() - 0.5) * this.speed * 2;
    }
    
    // Не выходим за границы
    checkBoundaries(this);
    this.energy -= 0.15;
  }

eat(herbivores, omnivores) {
  // Охота на травоядных (можно съесть любых)
  for (let i = 0; i < herbivores.length; i++) {
    const prey = herbivores[i];
    if (prey.hidden) continue;
    
    const dx = prey.x - this.x;
    const dy = prey.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    // Может съесть любого травоядного без ограничений
    if (dist < this.size + prey.size) {
      this.energy += 50;
      this.eatenCount++;
      
      if (!this.isAdult && this.eatenCount >= 5) {
        this.isAdult = true;
      }
      
      return { type: 'herbivore', index: i };
    }
  }
  
  // Охота на всеядных
  for (let i = 0; i < omnivores.length; i++) {
    const prey = omnivores[i];
    if (prey.hidden) continue;
    
    const dx = prey.x - this.x;
    const dy = prey.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    // Может съесть только если:
    // 1. Это не взрослое всеядное ИЛИ
    // 2. Это взрослое всеядное, но хищник тоже взрослый
    if (dist < this.size + prey.size && (!prey.isAdult || this.isAdult)) {
      this.energy += 50;
      this.eatenCount++;
      
      if (!this.isAdult && this.eatenCount >= 5) {
        this.isAdult = true;
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
    this.maxSize = 10;
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
    this.escapeAngle = 0;
    this.escapeMode = false;
    this.escapeTimer = 0;
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

 detectPredators(predators) {
  for (const predator of predators) {
    const dx = predator.x - this.x;
    const dy = predator.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    // Убегаем только от взрослых хищников
    if (dist < 120 && predator.isAdult && !this.escapeMode) {
      this.escapeMode = true;
      this.escapeTimer = 25 + Math.floor(Math.random() * 15);
      this.escapeAngle = Math.atan2(this.y - predator.y, this.x - predator.x);
      return true;
    }
  }
  return false;
}

  move(plants, herbivores, predators, omnivores) {
  if (this.reproductionCooldown > 0) this.reproductionCooldown--;
  
  // Проверяем наличие хищников поблизости
  let closestPredator = null;
  let minPredatorDist = Infinity;
  
  for (const predator of predators) {
    const dx = predator.x - this.x;
    const dy = predator.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist < minPredatorDist && dist < 150) {
      minPredatorDist = dist;
      closestPredator = predator;
    }
  }
  
  // Если хищник близко и мы взрослые, атакуем его, если он маленький
  if (closestPredator && this.isAdult && !closestPredator.isAdult) {
    const angle = Math.atan2(closestPredator.y - this.y, closestPredator.x - this.x);
    this.x += Math.cos(angle) * this.speed;
    this.y += Math.sin(angle) * this.speed;
    return;
  }
    
    this.detectPredators(predators);
    
    if (this.escapeMode) {
      zigzagEscape(this);
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
    this.size = 6 + Math.random() * 6;
    this.type = 'plant';
    this.color = `hsl(90, 80%, 30%)`;
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

  useEffect(() => {
    resetSimulation();
  }, []);

  const resetSimulation = () => {
    const initialOrganisms = [];
    for (let i = 0; i < 5; i++) {
      initialOrganisms.push(new Herbivore(i, Math.random() * (FIELD_WIDTH - 2*MARGIN) + MARGIN, 
  Math.random() * (FIELD_HEIGHT - 2*MARGIN) + MARGIN));
    }
    for (let i = 5; i < 10; i++) {
      initialOrganisms.push(new Predator(i, Math.random() * (FIELD_WIDTH - 2*MARGIN) + MARGIN, 
  Math.random() * (FIELD_HEIGHT - 2*MARGIN) + MARGIN));
    }
    for (let i = 10; i < 15; i++) {
      initialOrganisms.push(new Omnivore(i, Math.random() * (FIELD_WIDTH - 2*MARGIN) + MARGIN, 
  Math.random() * (FIELD_HEIGHT - 2*MARGIN) + MARGIN));
    }
    
    const initialPlants = [];
    for (let i = 0; i < 20; i++) {
      initialPlants.push(new Plant(i, Math.random() * 1300, Math.random() * 840));
    }
    
    setOrganisms(initialOrganisms);
    setPlants(initialPlants);
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
  const newOrganisms = []; // Перенесено перед циклом
  
  for (let i = 0; i < count; i++) {
    const newOrganism = (() => {
      switch(type) {
        case 'herbivore':
          return new Herbivore(
            Date.now() + i, 
            Math.random() * (FIELD_WIDTH - 2*MARGIN) + MARGIN,
            Math.random() * (FIELD_HEIGHT - 2*MARGIN) + MARGIN
          );
        case 'predator':
          return new Predator(
            Date.now() + i,
            Math.random() * (FIELD_WIDTH - 2*MARGIN) + MARGIN,
            Math.random() * (FIELD_HEIGHT - 2*MARGIN) + MARGIN
          );
        case 'omnivore':
          return new Omnivore(
            Date.now() + i,
            Math.random() * (FIELD_WIDTH - 2*MARGIN) + MARGIN,
            Math.random() * (FIELD_HEIGHT - 2*MARGIN) + MARGIN
          );
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
newPlants.push(new Plant(
  Date.now() + i,
  Math.random() * (FIELD_WIDTH - 2*MARGIN) + MARGIN,
  Math.random() * (FIELD_HEIGHT - 2*MARGIN) + MARGIN
));    }
    
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
            Object.assign(newOrg, org);
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
                                eaten.type === 'predator' ? predators :
                                eaten.type === 'omnivore' ? omnivores : null;
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
        
        const aliveOrganisms = newOrganisms.filter(o => o.energy > 0);
        
        setPlants(prevPlants => {
          const updatedPlants = [...prevPlants];
          if (Math.random() > 0.95) {
            updatedPlants.push(new Plant(Date.now(), Math.random() * 1290, Math.random() * 830));
          }
          return updatedPlants;
        });
        
        setStats(prev => ({
          ...prev,
          herbivores: aliveOrganisms.filter(o => o.type === 'herbivore').length,
          predators: aliveOrganisms.filter(o => o.type === 'predator').length,
          omnivores: aliveOrganisms.filter(o => o.type === 'omnivore').length,
          plants: plants.length,
          generation: prev.generation + 1
        }));
        
        return [...aliveOrganisms, ...organismsToAdd];
      });
    }, actualSpeed);
  
    return () => clearInterval(gameLoop);
  }, [isRunning, speedMultiplier, plants]);
   
 const renderScene = () => {
  const canvas = canvasRef.current;
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, 1300, 840);
  
  // Рисуем фон
  ctx.fillStyle = '#5c9eee';
  ctx.fillRect(0, 0, 1300, 840);
  
  // Сначала рисуем растения
  plants.forEach(plant => {
    // Проверяем, используется ли растение как укрытие
    const organismBehind = organisms.find(org => 
      org.currentShelter && org.currentShelter.id === plant.id && org.hidden
    );
    
    // Подсвечиваем растение, если оно укрывает кого-то
    ctx.fillStyle = organismBehind ? 'rgba(255, 255, 255, 0.8)' : plant.color;
    ctx.beginPath();
    ctx.arc(plant.x, plant.y, plant.size, 0, Math.PI * 2);
    ctx.fill();
    
    // Рисуем индикатор, если растение - укрытие
    if (organismBehind) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.beginPath();
      ctx.arc(plant.x, plant.y, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  });
  
  // Рисуем организмы, которые не спрятаны
  organisms.forEach(organism => {
    if (organism.hidden) return; // Не рисуем спрятавшиеся организмы
      
      // Тело организма
      ctx.fillStyle = organism.color;
      ctx.beginPath();
      ctx.arc(organism.x, organism.y, organism.size, 0, Math.PI * 2);
      ctx.fill();
      
      // Глаза
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
      
      // Зрачки
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
      
      // Золотая обводка для взрослых особей
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
  }, [organisms, plants, renderScene]);

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
              min="0.5" 
              max="4" 
              step="0.1"
              value={speedMultiplier} 
              onChange={(e) => setSpeedMultiplier(parseFloat(e.target.value))} 
            />
            <div className="speed-labels">
              <span style={{ left: '0%' }}>0.5x</span>
              <span style={{ left: '14.28%' }}>1x</span>
              <span style={{ left: '42.85%' }}>2x</span>
              <span style={{ left: '71.42%' }}>3x</span>
              <span style={{ left: '100%', transform: 'translateX(-100%)' }}>4x</span>
            </div>
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
