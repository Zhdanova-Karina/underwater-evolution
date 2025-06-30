import React, { useState, useEffect, useRef } from 'react';
import './App.css';

// Классы организмов
class Herbivore {
  constructor(id, x, y) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.size = 10; // Начальный размер
    this.maxSize = 20; // Максимальный размер взрослой особи
    this.speed = 1 + Math.random() * 2;
    this.energy = 100;
    this.type = 'herbivore';
    this.color = `hsl(120, 70%, 50%)`;
    this.eatenCount = 0; // Счетчик съеденных растений
    this.isAdult = false; // Флаг взрослой особи
    this.reproductionCooldown = 0; // Таймер перед следующим размножением
  }

  move(plants) {
    if (this.reproductionCooldown > 0) this.reproductionCooldown--;
    
    // Поиск ближайшего растения
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
    
    // Движение к растению или случайное блуждание
    if (closestPlant) {
      const angle = Math.atan2(closestPlant.y - this.y, closestPlant.x - this.x);
      this.x += Math.cos(angle) * this.speed;
      this.y += Math.sin(angle) * this.speed;
    } else {
      this.x += (Math.random() - 0.5) * this.speed * 2;
      this.y += (Math.random() - 0.5) * this.speed * 2;
    }
    
    // Ограничение движения в пределах холста
    this.x = Math.max(10, Math.min(1290, this.x));
    this.y = Math.max(10, Math.min(830, this.y));
    
    // Расход энергии
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
        
        // Проверка на достижение взрослого состояния
        if (!this.isAdult && this.eatenCount >= 5) {
          this.isAdult = true;
          this.size = this.maxSize;
        }
        
        return i; // Индекс съеденного растения
      }
    }
    return -1;
  }
  
  reproduce(other) {
    // Размножаемся только если оба взрослые и нет кулдауна
    if (this.isAdult && other && other.isAdult && this.reproductionCooldown === 0 && other.reproductionCooldown === 0) {
      this.reproductionCooldown = 50; // Устанавливаем кулдаун
      other.reproductionCooldown = 50;
      
      return new Herbivore(
        Date.now(), 
        this.x + (Math.random() - 0.5) * 50,
        this.y + (Math.random() - 0.5) * 50
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
    this.size = 10; // Начальный размер
    this.maxSize = 20; // Максимальный размер взрослой особи
    this.speed = 1.5 + Math.random() * 2;
    this.energy = 100;
    this.type = 'predator';
    this.color = `hsl(0, 80%, 50%)`;
    this.eatenCount = 0; // Счетчик съеденных жертв
    this.isAdult = false; // Флаг взрослой особи
    this.reproductionCooldown = 0; // Таймер перед следующим размножением
  }

  move(herbivores) {
    if (this.reproductionCooldown > 0) this.reproductionCooldown--;
    
    // Поиск ближайшей добычи
    let closestPrey = null;
    let minDist = Infinity;
    
    herbivores.forEach(prey => {
      const dx = prey.x - this.x;
      const dy = prey.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < minDist && dist < 300) {
        minDist = dist;
        closestPrey = prey;
      }
    });
    
    // Движение к добыче или случайное блуждание
    if (closestPrey) {
      const angle = Math.atan2(closestPrey.y - this.y, closestPrey.x - this.x);
      this.x += Math.cos(angle) * this.speed;
      this.y += Math.sin(angle) * this.speed;
    } else {
      this.x += (Math.random() - 0.5) * this.speed * 2;
      this.y += (Math.random() - 0.5) * this.speed * 2;
    }
    
    // Ограничение движения в пределах холста
    this.x = Math.max(10, Math.min(1290, this.x));
    this.y = Math.max(10, Math.min(830, this.y));
    
    // Расход энергии
    this.energy -= 0.15;
  }
  
  eat(herbivores) {
    for (let i = 0; i < herbivores.length; i++) {
      const prey = herbivores[i];
      const dx = prey.x - this.x;
      const dy = prey.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < this.size + prey.size) {
        this.energy += 50;
        this.eatenCount++;
        
        // Проверка на достижение взрослого состояния
        if (!this.isAdult && this.eatenCount >= 5) {
          this.isAdult = true;
          this.size = this.maxSize;
        }
        
        return i; // Индекс съеденной жертвы
      }
    }
    return -1;
  }
  
  reproduce(other) {
    // Размножаемся только если оба взрослые и нет кулдауна
    if (this.isAdult && other && other.isAdult && this.reproductionCooldown === 0 && other.reproductionCooldown === 0) {
      this.reproductionCooldown = 60; // Устанавливаем кулдаун
      other.reproductionCooldown = 60;
      
      return new Predator(
        Date.now(), 
        this.x + (Math.random() - 0.5) * 60,
        this.y + (Math.random() - 0.5) * 60
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
    this.size = 10; // Начальный размер
    this.maxSize = 15; // Максимальный размер взрослой особи
    this.speed = 1.2 + Math.random() * 2;
    this.energy = 100;
    this.type = 'omnivore';
    this.color = `hsl(240, 80%, 60%)`;
    this.eatenCount = 0; // Счетчик съеденной еды
    this.isAdult = false; // Флаг взрослой особи
    this.reproductionCooldown = 0; // Таймер перед следующим размножением
  }

  move(plants, herbivores) {
    if (this.reproductionCooldown > 0) this.reproductionCooldown--;
    
    // Поиск ближайшей еды (растение или травоядное)
    let closestFood = null;
    let minDist = Infinity;

    // Поиск растений
    plants.forEach(plant => {
      const dx = plant.x - this.x;
      const dy = plant.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < minDist && dist < 150) {
        minDist = dist;
        closestFood = plant;
      }
    });
    
    // Поиск травоядных
    herbivores.forEach(prey => {
      const dx = prey.x - this.x;
      const dy = prey.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < minDist && dist < 200) {
        minDist = dist;
        closestFood = prey;
      }
    });
    
    // Движение к еде или случайное блуждание
    if (closestFood) {
      const angle = Math.atan2(closestFood.y - this.y, closestFood.x - this.x);
      this.x += Math.cos(angle) * this.speed;
      this.y += Math.sin(angle) * this.speed;
    } else {
      this.x += (Math.random() - 0.5) * this.speed * 2;
      this.y += (Math.random() - 0.5) * this.speed * 2;
    }
    
    // Ограничение движения в пределах холста
    this.x = Math.max(10, Math.min(1290, this.x));
    this.y = Math.max(10, Math.min(830, this.y));
    
    // Расход энергии
    this.energy -= 0.12;
  }
  
  eat(plants, herbivores) {
    // Попытка съесть травоядное
    for (let i = 0; i < herbivores.length; i++) {
      const prey = herbivores[i];
      const dx = prey.x - this.x;
      const dy = prey.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < this.size + prey.size) {
        this.energy += 40;
        this.eatenCount++;
        
        // Проверка на достижение взрослого состояния
        if (!this.isAdult && this.eatenCount >= 10) {
          this.isAdult = true;
          this.size = this.maxSize;
        }
        
        return { type: 'herbivore', index: i };
      }
    }
    
    // Попытка съесть растение
    for (let i = 0; i < plants.length; i++) {
      const plant = plants[i];
      const dx = plant.x - this.x;
      const dy = plant.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < this.size + plant.size) {
        this.energy += 25;
        this.eatenCount++;
        
        // Проверка на достижение взрослого состояния
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
    // Размножаемся только если оба взрослые и нет кулдауна
    if (this.isAdult && other && other.isAdult && this.reproductionCooldown === 0 && other.reproductionCooldown === 0) {
      this.reproductionCooldown = 55; // Устанавливаем кулдаун
      other.reproductionCooldown = 55;
      
      return new Omnivore(
        Date.now(), 
        this.x + (Math.random() - 0.5) * 55,
        this.y + (Math.random() - 0.5) * 55
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
    this.size = 6 + Math.random() * 4;
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

  // Базовый интервал обновления (в мс)
  const baseSpeed = 100;

  // Инициализация симуляции
  useEffect(() => {
    resetSimulation();
  }, []);

  const resetSimulation = () => {
    // Создание начальных организмов
    const initialOrganisms = [];
    for (let i = 0; i < 5; i++) {
      initialOrganisms.push(new Herbivore(i, Math.random() * 1300, Math.random() * 840));
    }
    for (let i = 5; i < 10; i++) {
      initialOrganisms.push(new Predator(i, Math.random() * 1300, Math.random() * 840));
    }
    for (let i = 10; i < 15; i++) {
      initialOrganisms.push(new Omnivore(i, Math.random() * 1300, Math.random() * 840));
    }
    
    // Создание начальных растений
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
    const newOrganisms = [];
    
    for (let i = 0; i < count; i++) {
      const newOrganism = (() => {
        switch(type) {
          case 'herbivore':
            return new Herbivore(Date.now() + i, Math.random() * 1300, Math.random() * 840);
          case 'predator':
            return new Predator(Date.now() + i, Math.random() * 1300, Math.random() * 840);
          case 'omnivore':
            return new Omnivore(Date.now() + i, Math.random() * 1300, Math.random() * 840);
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
      newPlants.push(new Plant(Date.now() + i, Math.random() * 1300, Math.random() * 840));
    }
    
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
    
    // Копируем все важные свойства
    if (newOrg) {
      newOrg.energy = org.energy;
      newOrg.eatenCount = org.eatenCount;
      newOrg.isAdult = org.isAdult;
      newOrg.reproductionCooldown = org.reproductionCooldown;
      return newOrg;
    }
    return org;
  });
        
        const newPlants = [...plants];
        const organismsToAdd = [];
        
        // Обработка каждого организма
        for (const organism of newOrganisms) {
          if (organism.energy <= 0) continue;
          
          // Движение и питание в зависимости от типа
          if (organism.type === 'herbivore') {
            organism.move(newPlants);
            const eatenIndex = organism.eat(newPlants);
            if (eatenIndex !== -1) {
              newPlants.splice(eatenIndex, 1);
            }
          } else if (organism.type === 'predator') {
            const herbivores = newOrganisms.filter(o => o.type === 'herbivore');
            organism.move(herbivores);
            const eatenIndex = organism.eat(herbivores);
            if (eatenIndex !== -1) {
              const preyId = herbivores[eatenIndex].id;
              const preyIndex = newOrganisms.findIndex(o => o.id === preyId);
              if (preyIndex !== -1) {
                newOrganisms[preyIndex].energy = 0;
              }
            }
          } else if (organism.type === 'omnivore') {
            const herbivores = newOrganisms.filter(o => o.type === 'herbivore');
            organism.move(newPlants, herbivores);
            const eaten = organism.eat(newPlants, herbivores);
            if (eaten) {
              if (eaten.type === 'plant') {
                newPlants.splice(eaten.index, 1);
              } else {
                const preyId = herbivores[eaten.index].id;
                const preyIndex = newOrganisms.findIndex(o => o.id === preyId);
                if (preyIndex !== -1) {
                  newOrganisms[preyIndex].energy = 0;
                }
              }
            }
          }
        }
        
        // Проверка столкновений для размножения
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
        
        // Фильтрация мертвых организмов
        const aliveOrganisms = newOrganisms.filter(o => o.energy > 0);
        
        // Добавление новых растений
        if (Math.random() > 0.7) {
          newPlants.push(new Plant(Date.now(), Math.random() * 1300, Math.random() * 840));
        }
        
        // Обновление статистики
        setStats(prev => ({
          ...prev,
          herbivores: aliveOrganisms.filter(o => o.type === 'herbivore').length,
          predators: aliveOrganisms.filter(o => o.type === 'predator').length,
          omnivores: aliveOrganisms.filter(o => o.type === 'omnivore').length,
          plants: newPlants.length,
          generation: prev.generation + 1
        }));
        
        // Обновление растений
        setPlants(newPlants);
        
        return [...aliveOrganisms, ...organismsToAdd];
      });
    }, actualSpeed);
    
    return () => clearInterval(gameLoop);
  }, [isRunning, speedMultiplier, plants]);

  // Визуализация сцены
  const renderScene = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 1300, 840);
    
    // Рисование фона (океан)
    ctx.fillStyle = '#5c9eee';
    ctx.fillRect(0, 0, 1300, 840);
    
    // Рисование растений
    plants.forEach(plant => {
      ctx.fillStyle = plant.color;
      ctx.beginPath();
      ctx.arc(plant.x, plant.y, plant.size, 0, Math.PI * 2);
      ctx.fill();
    });
    
    // Рисование организмов
    organisms.forEach(organism => {
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
      
      // Индикатор взрослой особи (кружок вокруг)
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
  }, [organisms, plants]);

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
