let drones = [];

function setup() {
  createCanvas(800, 600);
  for (let i = 0; i < 10; i++) { // Create 10 drones
    drones.push(new Drone(random(width), random(height)));
  }
}
  
function draw() {
  background(200);
  for (let drone of drones) {
    drone.update();
    drone.show();
  }
}