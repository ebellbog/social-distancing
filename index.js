const gameState = {
    objects: [],
    selectedPerson: null,
    lastUpdateTime: null,
};

const COLORS = {
    default: 'white',
    selected: 'red',
    moving: 'lime',
    shadow: 'rgba(0, 0, 0, 0.3)'
}

let $game, ctx;
let gameWidth, gameHeight;

/* Game objects */

class Person {
    constructor(x, y) {
        this.position = {x : x || 0, y: y || 0};

        this.size = 12;
        this.color = COLORS.default;
        this.speed = 25;

        this.destination = null;

        this.home = null;
    }

    draw() {
        ctx.shadowColor = COLORS.shadow;
        ctx.shadowBlur = 4;
        // drawCircle(this.position.x, this.position.y, this.size, this.color);
        drawSquare(this.position.x, this.position.y, this.size, this.color);
    }

    update(timeElapsed) {
        if (!this.destination) {
            return;
        }

        const deltaY = this.destination.y - this.position.y;
        const deltaX = this.destination.x - this.position.x;
        const magnitude = Math.sqrt(Math.pow(deltaY, 2) + Math.pow(deltaX, 2));

        const newPosition = {
            x: this.position.x + (deltaX / magnitude) * this.speed * timeElapsed,
            y: this.position.y + (deltaY / magnitude) * this.speed * timeElapsed
        };

        if (magnitude < 5 || this.willCollide(newPosition)) {
            this.destination = null;
            this.color = COLORS.default;
            return;
        }

        this.position = newPosition;
    }

    select() {
        gameState.people.forEach(person => person.deselect());
        gameState.selectedPerson = this;
        this.color = COLORS.selected;
    }

    deselect() {
        this.color = COLORS.default;
        gameState.selectedPerson = null;
    }

    moveTo(pos) {
        this.deselect();

        this.destination = pos;
        this.color = COLORS.moving;
    }

    willCollide(newPosition) {
        for (let i = 0; i < gameState.people.length; i++) {
            const person = gameState.people[i];
            if (person == this) continue;

            const dist = getDistance(newPosition, person.position);
            if (dist < this.size * 2) {
                return true;
            }
        }
        return false;
    }
}

class Building {
    constructor(i, j, width, height) { 
        this.topRightCorner = {i, j};
        this.width = width;
        this.height = height;

        this.color = 'white';

        this.roads = [];
    }

    draw() {
        const coords = getCoordinatesFromGrid(this.topRightCorner);
        drawSquare(coords.x, coords.y, gameWidth / 12, this.color);
    }

    update() {}
}

class Road {
    constructor(startPoint, endPoint, startBuilding, endBuilding) {
        this.startPoint = startPoint;
        this.endPoint = endPoint;

        this.startBuilding = startBuilding;
        this.endBuilding = endBuilding;
    }

    draw() {
        ctx.strokeStyle = 'purple';
        ctx.lineWidth = 20;

        const startCoords = getCoordinatesFromGrid(this.startPoint);
        const endCoords = getCoordinatesFromGrid(this.endPoint);
        ctx.beginPath();
        ctx.moveTo(startCoords.x, startCoords.y);
        ctx.lineTo(endCoords.x, endCoords.y);
        ctx.stroke();
    }

    update() {}
}

/* Core game functions */

function animate() {
    update();
    draw();
    requestAnimationFrame(animate);
}

function update() {
    const timeElapsed = (Date.now() - gameState.lastUpdateTime)/60;
    gameState.objects.forEach(object => object.update(timeElapsed));
    gameState.lastUpdateTime = Date.now();
}

function draw() {
    ctx.clearRect(0, 0, gameWidth, gameHeight);

    for (let i = 0; i < 5; i++) {
        const position = gameHeight / 6 * (i+1);
        drawHorizontalGridLine(position);
        drawVerticalGridLine(position);
    }

    gameState.objects.forEach(object => object.draw());
    
}

/* Helper methods */

function drawCircle(x, y, size, color) {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI*2);
        ctx.fill();
}

function drawSquare(x, y, size, color) {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.rect(x - size / 2, y - size / 2, size, size);
        ctx.fill();
}

function drawHorizontalGridLine(y) {
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(gameWidth, y);
    ctx.stroke();
}

function drawVerticalGridLine(x) {
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, gameHeight);
    ctx.stroke();
}

function getClickCoordinates({clientX, clientY}) {
    const {top, left} = $game.position();
    const x = (clientX - left) * (gameWidth / $game.width()); 
    const y = (clientY - top) * (gameHeight / $game.height());
    return {x, y}; 
}

function getDistance(pt1, pt2) {
    return Math.sqrt(Math.pow(pt1.y - pt2.y, 2) + Math.pow(pt1.x - pt2.x, 2));
}

function findNearestPerson(coords) {
    for (let i = 0; i < gameState.people.length; i++) {
        const person = gameState.people[i];
        const dist = getDistance(coords, person.position);
        if (dist < person.size) return person;
    }
    return false;
}

function randInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}

function getCoordinatesFromGrid({i, j}) {
    return {x: (i + 1) * gameWidth / 6, y: (j + 1) * gameHeight / 6};
}

/* Setup */

$(document).ready(() => {
    $game = $('#game');
    ctx = $game[0].getContext('2d');
    gameWidth = parseInt($game.attr('width'));
    gameHeight = parseInt($game.attr('height'));

    // Generate basic map

    const building1 = new Building(0, 0, 1, 1);
    const building2 = new Building(0, 1, 1, 1);
    const road = new Road({i: 0, j: 0}, {i: 0, j: 1}, building1, building2);

    gameState.objects.push(road, building1, building2);

    // Start animation loop

    gameState.lastUpdateTime = Date.now();
    animate();
});