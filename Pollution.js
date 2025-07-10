export default class Pollution {
  constructor(id, x, y) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.size = 20;
    this.maxSize = 200;
    this.currentSize = 0; // Начинаем с 0 и увеличиваем
    this.growthRate = 1;
    this.lifetime = 500; // Время жизни в кадрах
    this.age = 0;
    this.fadeStart = 300; // Когда начинать исчезать
    this.color = 'rgba(0, 0, 0, 0.38)';
    this.isActive = true;
  }

  //Обновление загрязнения
  update() {
    if (!this.isActive) return;

    this.age++;
    
    // Фаза роста
    if (this.currentSize < this.maxSize && this.age < this.fadeStart) {
      this.currentSize = Math.min(this.maxSize, this.currentSize + this.growthRate);
    }
    // Фаза исчезновения
    else if (this.age >= this.fadeStart) {
      const fadeProgress = (this.age - this.fadeStart) / (this.lifetime - this.fadeStart);
      this.currentSize = this.maxSize * (1 - fadeProgress);
      
      if (this.age >= this.lifetime) {
        this.isActive = false;
      }
    }
  }

  //Проверяем попал ли объект в область загрязнения
  isPointInside(x, y) {
    if (!this.isActive) return false;
    const dx = x - this.x;
    const dy = y - this.y;
    return Math.sqrt(dx * dx + dy * dy) < this.currentSize;
  }
}

