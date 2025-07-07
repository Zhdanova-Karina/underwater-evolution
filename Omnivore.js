import { checkBoundaries, zigzagEscape } from './utils';

export default class Omnivore {
  constructor(id, x, y) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.size = 10;
    this.maxSize = 15;
    this.speed = 1.5 + Math.random() * 2;
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
      
      if (dist < minDist && dist < 400) {
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
      
      if (dist < minDist && dist < 400) {
        minDist = dist;
        closestFood = plant;
      }
    });
    
    herbivores.forEach(prey => {
      const dx = prey.x - this.x;
      const dy = prey.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < minDist && dist < 400) {
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
          
          if (dist < minDist && dist < 400) {
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
