import { checkBoundaries, zigzagEscape } from './utils';

export default class Herbivore {
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
      
      if (dist < minDist && dist < 400) {
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
