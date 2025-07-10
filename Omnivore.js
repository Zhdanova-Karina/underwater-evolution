import { checkBoundaries, zigzagEscape } from './utils.js';

export default class Omnivore {
  constructor(id, x, y) {
    // Базовые параметры организма
    this.id = id;
    this.x = x;
    this.y = y;
    this.size = 10;
    this.speed = 1.5 + Math.random() * 2;
    this.energy = 100;
    this.type = 'omnivore';
    this.color = `hsl(240, 80%, 60%)`;
    // Параметры роста и развития
    this.eatenCount = 0;
    this.isAdult = false;
    // Параметры размножения
    this.reproductionCooldown = 0;
    this.lifespan = 250 + Math.floor(Math.random() * 70);
    this.age = 0;
    this.reproductionDeathChance = 0.15;
    // Механика побега от опасности
    this.escapeMode = false;
    this.escapeTimer = 0;
    this.escapeAngle = 0;
    this.maturityThreshold = 7;
  }
// Поиск партнера для размножения среди других всеядных
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

  //Поиск опасных организмов поблизости
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

checkLineOfSight(prey, corals) {
  // Проверяем, есть ли прямая видимость между хищником и добычей
  const dx = prey.x - this.x;
  const dy = prey.y - this.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  
  // Нормализованный вектор направления
  const nx = dx / dist;
  const ny = dy / dist;
  
  // Проверяем пересечение с каждым кораллом
  for (const coral of corals) {
    // Упрощенная проверка пересечения линии и круга (коралла)
    const a = nx * nx + ny * ny;
    const b = 2 * (nx * (this.x - coral.x) + ny * (this.y - coral.y));
    const c = (this.x - coral.x) ** 2 + (this.y - coral.y) ** 2 - coral.size ** 2;
    
    const discriminant = b * b - 4 * a * c;
    
    if (discriminant >= 0) {
      // Линия пересекает коралл - нет прямой видимости
      return false;
    }
  }
  
  return true;
}

//Основной метод движения организма
  move(plants, herbivores, predators, omnivores, corals) {
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
      
      if (dist < minDist && dist < 550) {
        minDist = dist;
        closestFood = plant;
      }
    });
    
    herbivores.forEach(prey => {
      const dx = prey.x - this.x;
      const dy = prey.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < minDist && dist < 200 && this.checkLineOfSight(prey, corals)) {
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
          
          if (dist < minDist && dist < 800) {
            minDist = dist;
            closestFood = predator;
          }
        }
      });
    }
    // Движение к выбранной цели
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
  
  //Питание
  eat(plants, herbivores, predators) {
    for (let i = 0; i < herbivores.length; i++) {
      const prey = herbivores[i];
      const dx = prey.x - this.x;
      const dy = prey.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < this.size + prey.size) {
        this.energy += 40;
        this.eatenCount++;
        
        if (!this.isAdult && this.eatenCount >= this.maturityThreshold) {
          this.isAdult = true;
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
            
            if (!this.isAdult && this.eatenCount >= this.maturityThreshold) {
              this.isAdult = true;
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
        
        if (!this.isAdult && this.eatenCount >= this.maturityThreshold) {
          this.isAdult = true;
        }
        
        return { type: 'plant', index: i };
      }
    }
    
    return null;
  }
  
  //Размножение
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
