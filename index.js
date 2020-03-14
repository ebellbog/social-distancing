const gameState = {
    people: [],
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
    }

    draw() {
        ctx.shadowColor = COLORS.shadow;
        ctx.shadowBlur = 4;
        drawCircle(this.position.x, this.position.y, this.size, this.color);
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

/* Core game functions */

function animate() {
    update();
    draw();
    requestAnimationFrame(animate);
}

function update() {
    const timeElapsed = (Date.now() - gameState.lastUpdateTime)/60;
    gameState.people.forEach(person => person.update(timeElapsed));
    gameState.lastUpdateTime = Date.now();
}

function draw() {
    ctx.clearRect(0, 0, gameWidth, gameHeight);
    gameState.people.forEach(person => person.draw());
    
}

/* Helper methods */

function drawCircle(x, y, size, color) {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI*2);
        ctx.fill();
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

/* Setup */

$(document).ready(() => {
    $game = $('#game');
    ctx = $game[0].getContext('2d');
    gameWidth = parseInt($game.attr('width'));
    gameHeight = parseInt($game.attr('height'));

    // Generate some random people

    for (let i = 0; i < 10; i++) {
        gameState.people.push(new Person(randInt(0, gameWidth), randInt(0, gameHeight)));
    }

    // Start animation loop

    gameState.lastUpdateTime = Date.now();
    animate();

    // Create event handlers

    $game.click(e => {
        const coords = getClickCoordinates(e);

        const person = findNearestPerson(coords);
        if (person) {
            person.select();
        } else if (gameState.selectedPerson) {
            gameState.selectedPerson.moveTo(coords);
        }
    });
});