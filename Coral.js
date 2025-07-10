export default class Coral {
  constructor(id, x, y) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.size = 8 + Math.random() * 7; 
    this.color = `hsl(${Math.random() * 30 + 350}, 70%, 60%)`;
    this.type = 'coral';
    this.maskedHerbivoreId = null; // ID травоядного, которое маскируется
  }

  // Проверка, может ли коралл принять травоядное
  canAcceptHerbivore(herbivore) {
    const dx = herbivore.x - this.x;
    const dy = herbivore.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    return dist < this.size && !this.maskedHerbivoreId;
  }
  // Проверка на попадание в загрязнение
  isAffectedBy(pollution) {
    const dx = this.x - pollution.x;
    const dy = this.y - pollution.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    return dist < pollution.size + this.size;
  }
}
