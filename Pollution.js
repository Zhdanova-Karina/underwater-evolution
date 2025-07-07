import { checkBoundaries, zigzagEscape } from './utils';

export default class Pollution {
  constructor(id, x, y) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.size = 20;
    this.maxSize = 200;
    this.currentSize = 0;
    this.growthRate = 1;
    this.lifetime = 500;
    this.age = 0;
    this.fadeStart = 300;
    this.color = 'rgba(0, 0, 0, 0.7)';
    this.isActive = true;
  }

  update() {
    if (!this.isActive) return;

    this.age++;
    
    if (this.currentSize < this.maxSize && this.age < this.fadeStart) {
      this.currentSize = Math.min(this.maxSize, this.currentSize + this.growthRate);
    }
    else if (this.age >= this.fadeStart) {
      const fadeProgress = (this.age - this.fadeStart) / (this.lifetime - this.fadeStart);
      this.currentSize = this.maxSize * (1 - fadeProgress);
      
      if (this.age >= this.lifetime) {
        this.isActive = false;
      }
    }
  }

  isPointInside(x, y) {
    if (!this.isActive) return false;
    const dx = x - this.x;
    const dy = y - this.y;
    return Math.sqrt(dx * dx + dy * dy) < this.currentSize;
  }
}
