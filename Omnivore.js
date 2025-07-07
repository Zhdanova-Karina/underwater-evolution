import Organism from './Organism.js';

export default class Omnivore extends Organism {
  constructor(id, x, y) {
    super(id, x, y, 'omnivore', 'hsl(240, 80%, 60%)', {
      size: 10,
      maxSize: 15,
      speed: 1.5 + Math.random() * 2,
      lifespan: 250 + Math.floor(Math.random() * 70),
      reproductionDeathChance: 0.15,
      maturityThreshold: 7
    });
  }

  move(plants, herbivores, predators, omnivores) {
    if (!this.isAdult && this.checkDanger(predators)) {
      return;
    }
    
    const mate = this.isAdult ? this.findMate(omnivores) : null;
    let targets = [];
    
    if (mate) {
      targets = [mate];
    } else {
      targets = [...plants, ...herbivores];
      if (this.isAdult) {
        targets.push(...predators.filter(p => !p.isAdult));
      }
    }
    
    this.basicMove(targets);
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
}
