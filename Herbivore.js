import Organism from './Organism.js';
import { checkBoundaries } from './utils.js';


export default class Herbivore extends Organism {
  constructor(id, x, y) {
    super(id, x, y, 'herbivore', 'hsl(120, 70%, 50%)', {
      size: 10,
      maxSize: 10,
      speed: 1 + Math.random() * 3,
      lifespan: 300 + Math.floor(Math.random() * 100),
      initialEnergy: 200,
      energyDecay: 0.2,
      reproductionDeathChance: 0.1,
      maturityThreshold: 3
    });

    this.canDisguise = Math.random() < 0.5;
    this.isDisguised = false;
    this.disguiseColor = 'hsl(350, 70%, 60%)';
    this.currentCoralId = null;
    this.baseColor = 'hsl(120, 70%, 50%)';
  }

  move(plants, herbivores, predators, omnivores, corals = []) {
    if (this.energy <= 0) return;

    const dangerNearby = this.checkDanger([...predators, ...omnivores]);
    
    if (this.canDisguise && dangerNearby) {
      this.handleDisguise(corals);
    } else if (this.isDisguised) {
      this.resetDisguise();
    }

    if (this.isDisguised) {
      this.x += (Math.random() - 0.5) * 0.2;
      this.y += (Math.random() - 0.5) * 0.2;
      this.energy -= this.energyDecay * 0.5;
    } else {
      const target = this.findTarget(plants, herbivores);
      this.basicMove(target ? [target] : []);
      this.energy -= this.energyDecay;
    }

    checkBoundaries(this);
    this.checkAndGrow();
  }

  handleDisguise(corals) {
    if (!corals.length) {
      this.resetDisguise();
      return;
    }

    // Ищем ближайший свободный коралл
    let closestCoral = null;
    let minDistance = Infinity;

    for (const coral of corals) {
      // Пропускаем занятые кораллы (если у коралла есть свойство maskedHerbivoreId)
      if (coral.maskedHerbivoreId && coral.maskedHerbivoreId !== this.id) continue;

      const dx = coral.x - this.x;
      const dy = coral.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 50 && dist < minDistance) {
        minDistance = dist;
        closestCoral = coral;
      }
    }

    if (closestCoral) {
      // Маскируемся за кораллом
      this.isDisguised = true;
      this.color = this.disguiseColor;
      this.size = closestCoral.size * 0.8;
      this.currentCoralId = closestCoral.id;
      
      // "Притягиваемся" к кораллу
      this.x = closestCoral.x + (this.x - closestCoral.x) * 0.1;
      this.y = closestCoral.y + (this.y - closestCoral.y) * 0.1;
      
      // Помечаем коралл как занятый
      closestCoral.maskedHerbivoreId = this.id;
    } else {
      this.resetDisguise();
    }
  }

  resetDisguise() {
    if (this.isDisguised) {
      this.isDisguised = false;
      this.color = this.baseColor;
      this.size = this.baseSize;
      this.currentCoralId = null;
    }
  }

  findTarget(plants, herbivores) {
    // Ищем ближайшую еду или партнера для размножения
    let target = null;
    let minDist = Infinity;

    // Поиск растений
    for (const plant of plants) {
      const dx = plant.x - this.x;
      const dy = plant.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < minDist) {
        minDist = dist;
        target = plant;
      }
    }

    // Если взрослый - ищем партнера для размножения
    if (this.isAdult) {
      for (const herb of herbivores) {
        if (herb.id === this.id || !herb.isAdult) continue;

        const dx = herb.x - this.x;
        const dy = herb.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 100 && dist < minDist) {
          minDist = dist;
          target = herb;
        }
      }
    }

    return target;
  }

  eat(plants) {
    if (this.isDisguised || this.energy <= 0) return null;

    for (let i = 0; i < plants.length; i++) {
      const plant = plants[i];
      const dx = plant.x - this.x;
      const dy = plant.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < this.size + plant.size) {
        this.energy += 50; // Увеличил энергию от еды
        this.eatenCount++;
        this.checkAndGrow();
        return { type: 'plant', id: plant.id, index: i };
      }
    }
    return null;
  }

  reproduce(partner) {
    if (!this.isAdult || !partner.isAdult) return null;
    if (this.reproductionCooldown > 0 || partner.reproductionCooldown > 0) return null;
    if (this.energy < this.initialEnergy * 0.7 || partner.energy < partner.initialEnergy * 0.7) return null;

    const childX = (this.x + partner.x) / 2 + (Math.random() - 0.5) * 20;
    const childY = (this.y + partner.y) / 2 + (Math.random() - 0.5) * 20;
    const child = new Herbivore(Date.now(), childX, childY);

    // Наследование свойств
    child.canDisguise = Math.random() < 0.8 ? (this.canDisguise || partner.canDisguise) : Math.random() < 0.3;
    
    this.reproductionCooldown = 30;
    partner.reproductionCooldown = 30;
    this.energy *= 0.8;
    partner.energy *= 0.8;

    return child;
  }
}
