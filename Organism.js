import { checkBoundaries, zigzagEscape } from './utils.js';

export default class Organism {
  constructor(id, x, y, type, color, options = {}) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.size = options.size || 10;
    this.maxSize = options.maxSize || 20;
    this.speed = options.speed || (1 + Math.random() * 2);
    this.energy = 100;
    this.type = type;
    this.color = color;
    this.eatenCount = 0;
    this.isAdult = false;
    this.reproductionCooldown = 0;
    this.lifespan = options.lifespan || (200 + Math.floor(Math.random() * 100));
    this.age = 0;
    this.reproductionDeathChance = options.reproductionDeathChance || 0.1;
    this.escapeMode = false;
    this.escapeTimer = 0;
    this.escapeAngle = 0;
    this.maturityThreshold = options.maturityThreshold || 3;
  }

  findMate(organisms) {
    if (!this.isAdult || this.reproductionCooldown > 0) return null;
    
    let closestMate = null;
    let minDist = Infinity;
    const searchRadius = this.type === 'omnivore' ? 400 : 250;
    
    organisms.forEach(mate => {
      if (mate.id === this.id || !mate.isAdult || mate.reproductionCooldown > 0 || mate.type !== this.type) return;
      
      const dx = mate.x - this.x;
      const dy = mate.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < minDist && dist < searchRadius) {
        minDist = dist;
        closestMate = mate;
      }
    });
    
    return closestMate;
  }

  checkDanger(dangerousOrganisms) {
    for (const danger of dangerousOrganisms) {
      if (danger.isAdult || this.type === 'predator') {
        const dx = danger.x - this.x;
        const dy = danger.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < 150 && !this.escapeMode && (!this.isAdult || this.type !== 'predator')) {
          this.escapeMode = true;
          this.escapeTimer = 30 + Math.floor(Math.random() * 20);
          this.escapeAngle = Math.atan2(this.y - danger.y, this.x - danger.x);
          return true;
        }
      }
    }
    return false;
  }

  basicMove(targets) {
    if (this.escapeMode) {
      zigzagEscape(this);
      return;
    }
    
    if (this.reproductionCooldown > 0) this.reproductionCooldown--;
    
    let closestTarget = null;
    let minDist = Infinity;
    
    targets.forEach(target => {
      const dx = target.x - this.x;
      const dy = target.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < minDist && dist < 400) {
        minDist = dist;
        closestTarget = target;
      }
    });
    
    if (closestTarget) {
      const angle = Math.atan2(closestTarget.y - this.y, closestTarget.x - this.x);
      this.x += Math.cos(angle) * this.speed;
      this.y += Math.sin(angle) * this.speed;
    } else {
      this.x += (Math.random() - 0.5) * this.speed * 2;
      this.y += (Math.random() - 0.5) * this.speed * 2;
    }
    
    checkBoundaries(this);
    this.energy -= this.type === 'predator' ? 0.15 : (this.type === 'omnivore' ? 0.12 : 0.1);
  }

  checkAndGrow() {
    if (!this.isAdult && this.eatenCount >= this.maturityThreshold) {
      this.isAdult = true;
      this.size = this.maxSize;
    }
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
