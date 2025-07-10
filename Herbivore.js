import { checkBoundaries, zigzagEscape } from './utils.js';

export default class Herbivore {
  constructor(id, x, y) {
    // Обязательные свойства
    this.id = id;
    this.x = x;
    this.y = y;
    this.type = 'herbivore';
    
    // Физические параметры
    this.size = 10;
    this.speed = 1.5 + Math.random() * 3;
    
    // Энергия и жизненный цикл
    this.energy = 200;
    this.initialEnergy = 200;
    this.energyDecay = 0.2;
    this.lifespan = 300 + Math.floor(Math.random() * 100);
    this.age = 0;
    
    // Размножение
    this.isAdult = false;
    this.eatenCount = 0;
    this.maturityThreshold = 3;
    this.reproductionCooldown = 0;
    this.reproductionDeathChance = 0.1;
    
    // Маскировка
    this.canDisguise = Math.random() < 0.5;
    this.isDisguised = false;
    this.disguiseColor = 'hsl(71, 94.30%, 48.40%)';
    this.currentCoralId = null;
    this.baseColor = 'hsl(120, 70%, 50%)';
    this.color = this.baseColor;
  }

  //Поиск опасных организмов поблизости
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

  //Базовое движение
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
      
      if (dist < minDist && dist < 800) {
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

  //Проверка взрослый ли организм
  checkAndGrow() {
    if (!this.isAdult && this.eatenCount >= this.maturityThreshold) {
      this.isAdult = true;
    }
  }

  //Основной метод
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

  //Пытаемся замаскироваться за ближайшим кораллом
  handleDisguise(corals) {
    if (!corals.length) {
      this.resetDisguise(corals);
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
      this.resetDisguise(corals);
    }
  }

  //Освобождение от маскировки
  resetDisguise(corals = []) {
    if (this.isDisguised) {
      this.isDisguised = false;
      this.color = this.baseColor;
     // Освобождаем коралл
      if (this.currentCoralId) {
        const coral = corals.find(c => c.id === this.currentCoralId);
        if (coral) coral.maskedHerbivoreId = null;
      }
      
      this.currentCoralId = null;
    }
  }

// Ищем ближайшую еду или партнера для размножения
  findTarget(plants, herbivores) {
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
    if (this.isAdult&& this.reproductionCooldown <= 0) {
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

  //Питание
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

  //Размножение
  reproduce(partner) {
    if (!this.isAdult || !partner.isAdult) return null;
    if (this.reproductionCooldown > 0 || partner.reproductionCooldown > 0) return null;
    if (this.energy < this.initialEnergy * 0.7 || partner.energy < partner.initialEnergy * 0.7) return null;

    const childX = (this.x + partner.x) / 2 + (Math.random() - 0.5) * 20;
    const childY = (this.y + partner.y) / 2 + (Math.random() - 0.5) * 20;
    const child = new Herbivore(Date.now(), childX, childY);

    // Наследование свойств
    child.canDisguise = Math.random() < 0.8 ? (this.canDisguise || partner.canDisguise) : Math.random() < 0.3;
    
    this.reproductionCooldown = 100;
    partner.reproductionCooldown = 100;
    // Добавляем отталкивание
  const repelAngle = Math.atan2(this.y - partner.y, this.x - partner.x);
  const repelForce = 5;
   this.x += Math.cos(repelAngle) * repelForce;
  this.y += Math.sin(repelAngle) * repelForce;
  partner.x -= Math.cos(repelAngle) * repelForce;
  partner.y -= Math.sin(repelAngle) * repelForce;
    this.energy *= 0.8;
    partner.energy *= 0.8;

    return child;
  }};
