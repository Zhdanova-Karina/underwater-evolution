xport default class Coral {
  constructor(id, x, y) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.size = 8 + Math.random() * 7; // Увеличил размер
    this.color = `hsl(${Math.random() * 30 + 350}, 70%, 60%)`;
    this.type = 'coral';
    this.maskedHerbivoreId = null; // ID травоядного, которое маскируется
    this.health = 100;
  }

  update() {
    // Медленный рост
    if (this.size < 50 && Math.random() < 0.01) {
      this.size += 0.1;
    }
    
    // Освобождаем маскировку, если травоядное исчезло
    if (this.maskedHerbivoreId && Math.random() < 0.05) {
      this.maskedHerbivoreId = null;
    }
  }
  // Проверка на попадание в загрязнение
  isAffectedBy(pollution) {
    const dx = this.x - pollution.x;
    const dy = this.y - pollution.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    return dist < pollution.size + this.size;
  }
}
