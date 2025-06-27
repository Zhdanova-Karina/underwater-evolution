import React, { useState, useEffect, useRef } from 'react';
import './App.css';

// Классы организмов
class Herbivore {
  constructor(id, x, y) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.size = 8;
    this.speed = 1 + Math.random() * 2;
    this.energy = 100;
    this.type = 'herbivore';
    this.color = `hsl(120, 70%, 50%)`;
  }

  move(plants) {
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
    this.x = Math.max(10, Math.min(790, this.x));
    this.y = Math.max(10, Math.min(590, this.y));
    
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
        return i; // Индекс съеденного растения
      }
    }
    return -1;
  }
  
  reproduce() {
    if (this.energy > 150) {
      this.energy -= 50;
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
    this.size = 12;
    this.speed = 1.5 + Math.random() * 2;
    this.energy = 100;
    this.type = 'predator';
    this.color = `hsl(0, 80%, 50%)`;
  }

  move(herbivores) {
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
    this.x = Math.max(10, Math.min(790, this.x));
    this.y = Math.max(10, Math.min(590, this.y));
    
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
        return i; // Индекс съеденной жертвы
      }
    }
    return -1;
  }
  
  reproduce() {
    if (this.energy > 180) {
      this.energy -= 70;
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
    this.size = 10;
    this.speed = 1.2 + Math.random() * 2;
    this.energy = 100;
    this.type = 'omnivore';
    this.color = `hsl(240, 80%, 60%)`;
  }

  move(plants, herbivores) {
    // Поиск ближайшей еды (растение или травоядное)
    let closestFood = null;
    let minDist = Infinity;
    let foodType = null;

    // Поиск растений
    plants.forEach(plant => {
      const dx = plant.x - this.x;
      const dy = plant.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < minDist && dist < 150) {
        minDist = dist;
        closestFood = plant;
        foodType = 'plant';
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
        foodType = 'herbivore';
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
    this.x = Math.max(10, Math.min(790, this.x));
    this.y = Math.max(10, Math.min(590, this.y));
    
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
        return { type: 'plant', index: i };
      }
    }
    
    return null;
  }
  
  reproduce() {
    if (this.energy > 160) {
      this.energy -= 60;
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
  const [speed, setSpeed] = useState(100);
  const [stats, setStats] = useState({
    herbivores: 0,
    predators: 0,
    omnivores: 0,
    plants: 0,
    generation: 0
  });

  // Инициализация симуляции
  useEffect(() => {
    resetSimulation();
  }, []);

  const resetSimulation = () => {
    // Создание начальных организмов
    const initialOrganisms = [];
    for (let i = 0; i < 5; i++) {
      initialOrganisms.push(new Herbivore(i, Math.random() * 800, Math.random() * 600));
    }
    for (let i = 5; i < 10; i++) {
      initialOrganisms.push(new Predator(i, Math.random() * 800, Math.random() * 600));
    }
    for (let i = 10; i < 15; i++) {
      initialOrganisms.push(new Omnivore(i, Math.random() * 800, Math.random() * 600));
    }
    
    // Создание начальных растений
    const initialPlants = [];
    for (let i = 0; i < 20; i++) {
      initialPlants.push(new Plant(i, Math.random() * 800, Math.random() * 600));
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

  // Добавление нового организма
  const addOrganism = (type) => {
    const newOrganism = (() => {
      switch(type) {
        case 'herbivore':
          return new Herbivore(Date.now(), Math.random() * 800, Math.random() * 600);
        case 'predator':
          return new Predator(Date.now(), Math.random() * 800, Math.random() * 600);
        case 'omnivore':
          return new Omnivore(Date.now(), Math.random() * 800, Math.random() * 600);
        default:
          return null;
      }
    })();
    
    if (newOrganism) {
      setOrganisms(prev => [...prev, newOrganism]);
      setStats(prev => ({
        ...prev,
        [type + 's']: prev[type + 's'] + 1
      }));
    }
  };

  // Добавление нового растения
  const addPlant = () => {
    const newPlant = new Plant(Date.now(), Math.random() * 800, Math.random() * 600);
    setPlants(prev => [...prev, newPlant]);
    setStats(prev => ({
      ...prev,
      plants: prev.plants + 1
    }));
  };

  useEffect(() => {
    if (!isRunning) return;
    
    const gameLoop = setInterval(() => {
      setOrganisms(prevOrganisms => {
        // Создаем копии для работы внутри этого цикла
        const newOrganisms = prevOrganisms.map(org => {
          // Правильное клонирование с сохранением методов
          if (org.type === 'herbivore') {
            return new Herbivore(org.id, org.x, org.y);
          } else if (org.type === 'predator') {
            return new Predator(org.id, org.x, org.y);
          } else if (org.type === 'omnivore') {
            return new Omnivore(org.id, org.x, org.y);
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
          
          // Размножение
          const offspring = organism.reproduce();
          if (offspring) {
            organismsToAdd.push(offspring);
          }
        }
        
        // Фильтрация мертвых организмов
        const aliveOrganisms = newOrganisms.filter(o => o.energy > 0);
        
        // Добавление новых растений
        if (Math.random() > 0.7) {
          newPlants.push(new Plant(Date.now(), Math.random() * 800, Math.random() * 600));
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
        
        // Возвращаем обновленные организмы + потомство
        return [...aliveOrganisms, ...organismsToAdd];
      });
    }, speed);
    
    return () => clearInterval(gameLoop);
  }, [isRunning, speed, plants]); 

  // Визуализация сцены
  const renderScene = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 800, 600);
    
    // Рисование фона (океан)
    ctx.fillStyle = '#1e3f66';
    ctx.fillRect(0, 0, 800, 600);
    
    // Рисование растений
    plants.forEach(plant => {
      ctx.fillStyle = plant.color;
      ctx.beginPath();
      ctx.arc(plant.x, plant.y, plant.size, 0, Math.PI * 2);
      ctx.fill();
    });
    
    // Рисование организмов
    organisms.forEach(organism => {
      ctx.fillStyle = organism.color;
      ctx.beginPath();
      ctx.arc(organism.x, organism.y, organism.size, 0, Math.PI * 2);
      ctx.fill();
      
      // Рисование глаз
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
      
      // Рисование зрачков
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
    });
  };

  // Обновление сцены при изменениях
  useEffect(() => {
    renderScene();
  }, [organisms, plants]);

  return (
    <div className="evolution-simulator">
      <h1>Эволюция Подводного Мира</h1>
      
      <div className="simulation-container">
        <canvas 
          ref={canvasRef} 
          width={800} 
          height={600} 
          className="simulation-canvas"
        />
        
        <div className="controls-panel">
          <div className="stats">
            <h2>Статистика</h2>
            <p>Поколение: {stats.generation}</p>
            <p>Травоядные: {stats.herbivores}</p>
            <p>Хищники: {stats.predators}</p>
            <p>Всеядные: {stats.omnivores}</p>
            <p>Растения: {stats.plants}</p>
          </div>
          
          <div className="speed-control">
            <h2>Скорость</h2>
            <input 
              type="range" 
              min="50" 
              max="500" 
              step="50"
              value={speed} 
              onChange={(e) => setSpeed(500 - e.target.value)} 
            />
            <p>{500 - speed} мс/цикл</p>
          </div>
          
          <div className="add-organisms">
            <h2>Добавить организмы</h2>
            <button onClick={() => addOrganism('herbivore')}>Травоядное</button>
            <button onClick={() => addOrganism('predator')}>Хищник</button>
            <button onClick={() => addOrganism('omnivore')}>Всеядное</button>
          </div>
          
          <div className="add-plants">
            <h2>Добавить растения</h2>
            <button onClick={addPlant}>Добавить растение</button>
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
