import Organism from './Organism.js';

export default class Predator extends Organism {
  constructor(id, x, y) {
    super(id, x, y, 'predator', 'hsl(0, 80%, 50%)', {
      size: 10,
      maxSize: 10,
      speed: 1.5 + Math.random() * 2,
      lifespan: 200 + Math.floor(Math.random() * 50),
      reproductionDeathChance: 0.2,
      maturityThreshold: 5
    });
  }

  move(herbivores, omnivores, predators) {
    if (!this.isAdult && this.checkDanger(omnivores)) {
      return;
    }
    
    const mate = this.isAdult ? this.findMate(predators) : null;
    const targets = mate ? [mate] : [...herbivores, ...omnivores];
    this.basicMove(targets);
  }
  
  eat(herbivores, omnivores) {
    const preyList = [...herbivores, ...omnivores];
    
    for (let i = 0; i < preyList.length; i++) {
      const prey = preyList[i];
      const dx = prey.x - this.x;
      const dy = prey.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < this.size + prey.size) {
        this.energy += 50;
        this.eatenCount++;
        this.checkAndGrow();
        return { 
          type: prey.type, 
          index: i >= herbivores.length ? 
                 i - herbivores.length : 
                 i 
        };
      }
    }
    
    return null;
  }
}
