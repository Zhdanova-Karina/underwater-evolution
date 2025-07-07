import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import Herbivore from './Herbivore';
import Predator from './Predator';
import Omnivore from './Omnivore';
import Plant from './Plant';
import Pollution from './Pollution';
import Coral from './Coral';
import { checkBoundaries, zigzagEscape } from './utils';

function UnderwaterEvolution() {
  const canvasRef = useRef(null);
  const [organisms, setOrganisms] = useState([]);
  const [plants, setPlants] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [speedMultiplier, setSpeedMultiplier] = useState(1);
  const [corals, setCorals] = useState([]);
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
    plant: 1,
    coral: 1
  });

  const baseSpeed = 100;
  const [pollutions, setPollutions] = useState([]);

  const addPollution = () => {
    const newPollution = new Pollution(
      Date.now(),
      Math.random() * 1200 + 50,
      Math.random() * 700 + 50
    );
    setPollutions(prev => [...prev, newPollution]);
  };

  useEffect(() => {
    resetSimulation();
  }, []);

  const resetSimulation = () => {
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
    
    const initialPlants = [];
    for (let i = 0; i < 20; i++) {
      initialPlants.push(new Plant(i, Math.random() * 1300, Math.random() * 840));
    }
    
    const initialCorals = [];
    for (let i = 0; i < 10; i++) {
      initialCorals.push(new Coral(i, Math.random() * 1300, Math.random() * 840));
    }
    
    setOrganisms(initialOrganisms);
    setPlants(initialPlants);
    setCorals(initialCorals);
    setPollutions([]);
    setStats({
      herbivores: 5,
      predators: 5,
      omnivores: 5,
      plants: 20,
      corals: 10,
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
        // Обновляем состояние всех организмов
        const newOrganisms = prevOrganisms.map(org => {
          let newOrg;
          if (org.type === 'herbivore') {
            newOrg = new Herbivore(org.id, org.x, org.y);
            Object.assign(newOrg, org);
          } else if (org.type === 'predator') {
            newOrg = new Predator(org.id, org.x, org.y);
            Object.assign(newOrg, org);
          } else if (org.type === 'omnivore') {
            newOrg = new Omnivore(org.id, org.x, org.y);
            Object.assign(newOrg, org);
          }
          return newOrg || org;
        });
        
        const newPlants = [...plants];
        const organismsToAdd = [];
        
        // Сбрасываем маскировку всех кораллов
        const updatedCorals = corals.map(coral => {
          const newCoral = new Coral(coral.id, coral.x, coral.y);
          newCoral.maskedHerbivoreId = null;
          return newCoral;
        });
        
        
        const herbivores = newOrganisms.filter(o => o.type === 'herbivore');
        const predators = newOrganisms.filter(o => o.type === 'predator');
        const omnivores = newOrganisms.filter(o => o.type === 'omnivore');
        
        // Обрабатываем движение и питание травоядных
        herbivores.forEach(herbivore => {
          if (herbivore.energy <= 0) return;
          
          // Проверяем маскировку
          herbivore.isDisguised = false;
          
          // Ищем ближайший коралл для маскировки
          let closestCoral = null;
          let minDistance = Infinity;
          
          updatedCorals.forEach(coral => {
            if (coral.maskedHerbivoreId) return; // Коралл уже занят
            
            const dx = herbivore.x - coral.x;
            const dy = herbivore.y - coral.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < coral.size + herbivore.size && dist < minDistance) {
              minDistance = dist;
              closestCoral = coral;
            }
          });
          
          // Если нашли свободный коралл рядом - маскируемся
          if (closestCoral) {
            closestCoral.maskedHerbivoreId = herbivore.id;
            herbivore.isDisguised = true;
            herbivore.x = closestCoral.x;
            herbivore.y = closestCoral.y;
          } else {
            // Если не маскируемся - двигаемся и едим
            herbivore.move(newPlants, herbivores, predators, omnivores, updatedCorals);
            const eaten = herbivore.eat(newPlants);
            
            const eatenIndex = herbivore.eat(newPlants);
          if (eatenIndex !== -1) {
            newPlants.splice(eatenIndex, 1);
          }
          }
        });
        
        // Обрабатываем хищников
        predators.forEach(predator => {
          if (predator.energy <= 0) return;
          
          predator.move(herbivores, omnivores, predators);
          const eaten = predator.eat(herbivores, omnivores);
          
          if (eaten) {
            const preyArray = eaten.type === 'herbivore' ? herbivores : omnivores;
            const preyId = preyArray[eaten.index].id;
            const preyIndex = newOrganisms.findIndex(o => o.id === preyId);
            if (preyIndex !== -1) {
              newOrganisms[preyIndex].energy = 0;
            }
          }
        });
        
        // Обрабатываем всеядных
        omnivores.forEach(omnivore => {
          if (omnivore.energy <= 0) return;
          
          omnivore.move(newPlants, herbivores, predators, omnivores);
          const eaten = omnivore.eat(newPlants, herbivores, predators);
          
          if (eaten) {
            if (eaten.type === 'plant') {
              newPlants.splice(eaten.index, 1);
            } else {
              const preyArray = eaten.type === 'herbivore' ? herbivores : 
                              eaten.type === 'predator' ? predators : null;
              if (preyArray) {
                const preyId = preyArray[eaten.index].id;
                const preyIndex = newOrganisms.findIndex(o => o.id === preyId);
                if (preyIndex !== -1) {
                  newOrganisms[preyIndex].energy = 0;
                }
              }
            }
          }
        });
        
        // Размножение
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
        
        // Обновляем загрязнения
const updatedPollutions = pollutions
  .map(p => {
    const newP = new Pollution(p.id, p.x, p.y);
    Object.assign(newP, p);
    newP.update(); // Это теперь будет изменять размер и прозрачность
    return newP;
  })
  .filter(p => p.isActive); // Удаляем неактивные
        
        // Удаляем организмы, растения и кораллы, попавшие в загрязнение
const updatedPlants = newPlants.filter(plant => {
  return !updatedPollutions.some(pollution => 
    pollution.isPointInside(plant.x, plant.y)
  );
});

const updatedCoralsPollution = corals.filter(coral => {
  return !updatedPollutions.some(pollution => 
    pollution.isPointInside(coral.x, coral.y)
  );
});

const updatedOrganisms = [...newOrganisms, ...organismsToAdd]
  .filter(organism => {
    if (organism.energy <= 0) return false;
    return !updatedPollutions.some(pollution => pollution.isPointInside(organism.x, organism.y));
  });

// Освобождаем травоядных, чьи кораллы погибли
const survivingCoralIds = new Set(updatedCorals.map(c => c.id));
newOrganisms.forEach(org => {
  if (org.type === 'herbivore' && org.currentCoralId && !survivingCoralIds.has(org.currentCoralId)) {
    org.resetDisguise();
  }
});
        
        setPlants(updatedPlants);
        setPollutions(updatedPollutions);
        setCorals(updatedCoralsPollution);
        
        setStats(prev => ({
          ...prev,
          herbivores: updatedOrganisms.filter(o => o.type === 'herbivore').length,
          predators: updatedOrganisms.filter(o => o.type === 'predator').length,
          omnivores: updatedOrganisms.filter(o => o.type === 'omnivore').length,
          plants: updatedPlants.length,
          corals: updatedCorals.length,
          generation: prev.generation + 1
        }));
        
        return updatedOrganisms;
      });
    }, actualSpeed);

    return () => clearInterval(gameLoop);
  }, [isRunning, speedMultiplier, plants, pollutions, corals]);

  const renderScene = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 1300, 840);
    
    // Рисуем фон
    ctx.fillStyle = '#5c9eee';
    ctx.fillRect(0, 0, 1300, 840);
    
    // Рисуем кораллы
    corals.forEach(coral => {
      ctx.fillStyle = coral.color;
      ctx.beginPath();
      ctx.arc(coral.x, coral.y, coral.size, 0, Math.PI * 2);
      ctx.fill();
      
      // Добавляем детали к кораллам
      ctx.fillStyle = 'rgba(0,0,0,0.1)';
      for (let i = 0; i < 10; i++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.random() * coral.size;
        ctx.beginPath();
        ctx.arc(
          coral.x + Math.cos(angle) * dist,
          coral.y + Math.sin(angle) * dist,
          1 + Math.random() * 3,
          0,
          Math.PI * 2
        );
        ctx.fill();
      }
    });
    
    // Рисуем растения
    plants.forEach(plant => {
      ctx.fillStyle = plant.color;
      ctx.beginPath();
      ctx.arc(plant.x, plant.y, plant.size, 0, Math.PI * 2);
      ctx.fill();
    });
    
    // Рисуем организмы
    organisms.forEach(organism => {
      // Если травоядное замаскировано - рисуем его как часть коралла
      if (organism.type === 'herbivore' && organism.isDisguised) {
        // Тело замаскированного организма
    ctx.fillStyle = organism.disguiseColor || '#8a6d3b';
    ctx.beginPath();
    ctx.arc(organism.x, organism.y, organism.size, 0, Math.PI * 2);
    ctx.fill();
    
    // Глаза замаскированного организма (добавлено)
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
    
    // Зрачки замаскированного организма (добавлено)
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
      } else {
        // Рисуем обычный организм
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
      }
      
      // Обводка для взрослых особей
      if (organism.isAdult) {
        ctx.strokeStyle = 'gold';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(organism.x, organism.y, organism.size + 3, 0, Math.PI * 2);
        ctx.stroke();
      }
    });
    
    // Рисуем загрязнения
pollutions.forEach(pollution => {
  ctx.fillStyle = pollution.color;
  ctx.beginPath();
  ctx.arc(pollution.x, pollution.y, pollution.size, 0, Math.PI * 2);
  ctx.fill();
  
  // Добавляем эффект "грязи"
  ctx.fillStyle = 'rgba(50, 50, 50, 0.2)';
  for (let i = 0; i < 10; i++) {
    const angle = Math.random() * Math.PI * 2;
    const dist = Math.random() * pollution.size;
    ctx.beginPath();
    ctx.arc(
      pollution.x + Math.cos(angle) * dist,
      pollution.y + Math.sin(angle) * dist,
      2 + Math.random() * 5,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }
});
  };

  useEffect(() => {
    renderScene();
  }, [organisms, plants, corals, pollutions]);

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
          <p>Кораллы: {corals.length}</p>
          <p>Замаскированные: {organisms.filter(o => o.isDisguised).length}</p>
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
              min="0.25" 
              max="4" 
              step="0.25"
              value={speedMultiplier} 
              onChange={(e) => setSpeedMultiplier(parseFloat(e.target.value))} 
            />
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
            
            <div className="add-control">
              <input 
                type="number" 
                min="1" 
                max="20"
                value={addCounts.coral}
                onChange={(e) => setAddCounts(prev => ({
                  ...prev,
                  coral: Math.max(1, parseInt(e.target.value) || 1)
                }))}
              />
              <button onClick={() => {
                const newCorals = [];
                for (let i = 0; i < addCounts.coral; i++) {
                  newCorals.push(new Coral(
                    Date.now() + i,
                    Math.random() * 1300,
                    Math.random() * 840
                  ));
                }
                setCorals(prev => [...prev, ...newCorals]);
              }}>Коралл</button>
            </div>
            
            <div className="add-control">
              <button onClick={addPollution}>Загрязнение</button>
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
