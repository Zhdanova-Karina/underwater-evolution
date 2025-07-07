export default class Plant {
  constructor(id, x, y) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.size = 6 + Math.random() * 4;
    this.type = 'plant';
    this.color = `hsl(90, 80%, 30%)`;
  }
}
