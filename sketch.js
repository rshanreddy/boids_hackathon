let drones = []; // Define drones array at the top level
let jammer; // Define jammer at the top level
let attractionSlider, cohesionSlider, separationSlider, alignmentSlider;
let attractionLabel, cohesionLabel, separationLabel, alignmentLabel;

class Drone {
  constructor(x, y) {
    this.position = createVector(x, y);
    this.velocity = p5.Vector.random2D();
    this.velocity.setMag(random(0.5, 2)); // Slower initial speeds
    this.acceleration = createVector();
    this.maxForce = 0.05; // Weaker forces to start with
    this.maxSpeed = 2;
  }

  update() {
    this.edges(); // Call the edges method to check for boundaries
    this.position.add(this.velocity);
    this.velocity.add(this.acceleration);
    this.velocity.limit(this.maxSpeed);
    this.acceleration.mult(0);

    this.velocity.add(p5.Vector.random2D().mult(0.1));
  }  

  attractToJammer(jammer) {
    let desired = createVector(jammer.x - this.position.x, jammer.y - this.position.y);
    desired.setMag(this.maxSpeed);
    let steer = p5.Vector.sub(desired, this.velocity);
    steer.limit(attractionSlider.value()); // Use the slider value for limiting the steer force
    return steer;
  }  

  show() {
    // Set the drone color to blue
    fill(0, 0, 255);
    stroke(200);
    strokeWeight(1);

    // Calculate the heading angle from the velocity
    let theta = this.velocity.heading() + radians(90);

    // Transformation to position and rotate the triangle
    push();
    translate(this.position.x, this.position.y);
    rotate(theta);

    // Drawing the triangle
    beginShape();
    vertex(0, -6); // Nose of the drone
    vertex(-3, 6); // Left rear of the drone
    vertex(3, 6); // Right rear of the drone
    endShape(CLOSE);

    // Restore previous transformation state
    pop();
  }

  applyForce(force) {
    this.acceleration.add(force);
  }

  align(drones) {
    let perceptionRadius = 50;
    let steering = createVector();
    let total = 0;
    for (let other of drones) {
      let d = dist(this.position.x, this.position.y, other.position.x, other.position.y);
      if (other != this && d < perceptionRadius) {
        steering.add(other.velocity);
        total++;
      }
    }
    if (total > 0) {
      steering.div(total);
      steering.setMag(this.maxSpeed);
      steering.sub(this.velocity);
      steering.limit(alignmentSlider.value()); // Use the slider value
    }
    return steering;
  }  

  detectSignal(jammer) {
    let distance = dist(this.position.x, this.position.y, jammer.x, jammer.y);
    let signalStrength = 1 / distance;
    return signalStrength;
  }

  edges() {
    const margin = 50; // Distance from the edge at which drones start turning back
    const turnForce = 1; // Adjust the sharpness of the turn
    let steer = createVector(0, 0);

    if (this.position.x < margin) {
      steer.x = turnForce;
    } else if (this.position.x > width - margin) {
      steer.x = -turnForce;
    }

    if (this.position.y < margin) {
      steer.y = turnForce;
    } else if (this.position.y > height - margin) {
      steer.y = -turnForce;
    }

    this.applyForce(steer);
  }

  separation(drones) {
    let perceptionRadius = 50; // How close drones get before starting to separate
    let steering = createVector();
    let total = 0; // Total drones within perception radius
    for (let other of drones) {
      let d = dist(this.position.x, this.position.y, other.position.x, other.position.y);
      if (other != this && d < perceptionRadius) {
        let diff = p5.Vector.sub(this.position, other.position);
        diff.div(d * d); // Weight by distance squared
        steering.add(diff);
        total++;
      }
    }
    if (total > 0) {
      steering.div(total);
      steering.setMag(this.maxSpeed);
      steering.sub(this.velocity);
      steering.limit(this.maxForce);
    }
    return steering;
  };

  cohesion(drones) {
    let perceptionRadius = 100; // How far each drone can "see"
    let steering = createVector();
    let total = 0; // Total drones within perception radius
    for (let other of drones) {
      let d = dist(this.position.x, this.position.y, other.position.x, other.position.y);
      if (other != this && d < perceptionRadius) {
        steering.add(other.position); // Add position of each nearby drone
        total++;
      }
    }
    if (total > 0) {
      steering.div(total); // Get the average position
      steering.sub(this.position); // Get the vector pointing towards the average position
      steering.setMag(this.maxSpeed); // Set the desired magnitude of the velocity
      steering.sub(this.velocity); // Steering is desired minus current velocity
      steering.limit(this.maxForce); // Limit the force to maximum capability
    }
    return steering;
  };

  detectSignal(jammer) {
    let distance = dist(this.position.x, this.position.y, jammer.x, jammer.y);
    let signalStrength = 1 / (distance * distance); // Inverse square law for signal
    this.signalStrengthAccumulated += signalStrength; // Accumulate signal strength
  
    // Consider signal detected only if accumulated strength crosses a threshold
    if (this.signalStrengthAccumulated > this.signalThreshold) {
      // Reset accumulated signal strength if you want the detection to be continuous
      // this.signalStrengthAccumulated = 0;
      return signalStrength;
    } else {
      return 0; // Return 0 signal strength if threshold not crossed
    }
  }
  
}

function setup() {
  // Create the canvas and move it into the canvas-container div
  let canvas = createCanvas(800, 400); // Example: Reduce height
  canvas.parent('canvas-container');

  // Initialize the jammer and drones array
  jammer = { x: random(width), y: random(height) };
  for (let i = 0; i < 50; i++) {
    drones.push(new Drone(random(width), random(height)));
  }

  // Create and position the sliders within their own div containers
  let attractionContainer = createDiv('');
  attractionContainer.class('slider-container');
  attractionSlider = createSlider(0, 2, 0.1, 0.05);
  attractionSlider.parent(attractionContainer);
  attractionLabel = createP('Attraction Force:');
  attractionLabel.parent(attractionContainer);

  let cohesionContainer = createDiv('');
  cohesionContainer.class('slider-container');
  cohesionSlider = createSlider(0, 5, 1, 0.1);
  cohesionSlider.parent(cohesionContainer);
  cohesionLabel = createP('Cohesion Force:');
  cohesionLabel.parent(cohesionContainer);

  let separationContainer = createDiv('');
  separationContainer.class('slider-container');
  separationSlider = createSlider(0, 5, 1, 0.1);
  separationSlider.parent(separationContainer);
  separationLabel = createP('Separation Force:');
  separationLabel.parent(separationContainer);

  let alignmentContainer = createDiv('');
  alignmentContainer.class('slider-container');
  alignmentSlider = createSlider(0, 5, 1, 0.1);
  alignmentSlider.parent(alignmentContainer);
  alignmentLabel = createP('Alignment Force:');
  alignmentLabel.parent(alignmentContainer);

  // Position the entire controls container below the canvas
  let controlsDiv = select('#controls');
  attractionContainer.parent(controlsDiv);
  cohesionContainer.parent(controlsDiv);
  separationContainer.parent(controlsDiv);
  alignmentContainer.parent(controlsDiv);

  let resetButton = select('#resetButton');
  resetButton.mousePressed(resetSimulation);
}

function draw() {
  background(200);

  for (let drone of drones) {
    // Calculate forces for each behavior
    let alignmentForce = drone.align(drones);
    let cohesionForce = drone.cohesion(drones);
    let separationForce = drone.separation(drones);
    let attractionForce = drone.attractToJammer(jammer);

    // Apply the forces, scaled by their respective slider values
    drone.applyForce(alignmentForce.mult(alignmentSlider.value()));
    drone.applyForce(cohesionForce.mult(cohesionSlider.value()));
    drone.applyForce(separationForce.mult(separationSlider.value()));
    drone.applyForce(attractionForce.mult(attractionSlider.value()));

    // Update and display the drone
    drone.update();
    drone.show();
  }

  // Draw the jammer
  fill(255, 0, 0);
  ellipse(jammer.x, jammer.y, 25, 25);

  // Update the labels with the current values from the sliders
  attractionLabel.html(`Attraction Force: ${attractionSlider.value()}`);
  cohesionLabel.html(`Cohesion Force: ${cohesionSlider.value()}`);
  separationLabel.html(`Separation Force: ${separationSlider.value()}`);
  alignmentLabel.html(`Alignment Force: ${alignmentSlider.value()}`);
}

// Define the resetSimulation function
function resetSimulation() {
  // Clear the drones array and repopulate it
  drones = [];
  for (let i = 0; i < 50; i++) {
    drones.push(new Drone(random(width), random(height)));
  }

  // Reset the jammer location if it's supposed to change
  jammer = { x: random(width), y: random(height) };

  // Reset any other necessary variables to their initial states
  // For example, if you have a global variable for accumulated signal strength, reset it here
}