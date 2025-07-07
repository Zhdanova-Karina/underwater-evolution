import Organism from './Organism.js';

export default class Herbivore extends Organism {
  constructor(id, x, y) {
    super(id, x, y, 'herbivore', 'hsl(120, 70%, 50%)', {
      size: 10,
      maxSize: 20,
      speed: 1 + Math.random() * 2,
      lifespan: 300 + Math.floor(Math.random() * 100),
      reproductionDeathChance: 0.1,
      maturityThreshold: 3
    });
  }

  move(plants, herbivores, predators, omnivores) {
    if (this.checkDanger([...predators, ...omnivores])) {
      return;
    }
    
    const mate = this.isAdult ? this.findMate(herbivores) : null;
    const targets = mate ? [mate] : plants;
    this.basicMove(targets);
  }
  
  eat(plants) {
    for (let i = plants.length - 1; i >= 0; i--) { // Идём с конца
      const plant = plants[i];
      const dx = plant.x - this.x;
      const dy = plant.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < this.size + plant.size) {
        this.energy += 30;
        this.eatenCount++;
        this.checkAndGrow();
        return { type: 'plant', index: i }; // Индекс остаётся корректным
      }
    }
    return null;
}
}
