export function checkBoundaries(organism) {
  organism.x = Math.max(10, Math.min(1290, organism.x));
  organism.y = Math.max(10, Math.min(830, organism.y));
}

export function zigzagEscape(organism) {
  if (organism.escapeTimer % 5 === 0) {
    organism.escapeAngle += (Math.random() - 0.5) * Math.PI / 2;
  }
  
  organism.x += Math.cos(organism.escapeAngle) * organism.speed * 1.5;
  organism.y += Math.sin(organism.escapeAngle) * organism.speed * 1.5;
  
  checkBoundaries(organism);
  organism.escapeTimer--;
  organism.energy -= 0.25;
  
  if (organism.escapeTimer <= 0) {
    organism.escapeMode = false;
  }
}
