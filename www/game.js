let scene, camera, renderer, ball, platforms, stars, asteroids, clock, scoreElement;
const platformCount = 5;
const platformSpeed = 0.05;
const ballSpeed = 2;
const gravity = 4.9; // Reduced gravity for slower falling
const bounceVelocity = Math.sqrt(2 * gravity * (window.innerHeight / 3 / 100)); // Velocity for a third of the screen height
const starCount = 50;
const maxAsteroids = 10;
const startY = 5.0;

// lock the device orientation
window.screen.orientation.lock('landscape-primary')

window.oncontextmenu = function(event) {
     event.preventDefault();
     event.stopPropagation();
     return false;
};

function webViewLoaded(args) {
     if (args.object.android) {
      var webView = args.object.android;
      webView.getSettings().setAllowUniversalAccessFromFileURLs(true);
     } 
}

document.getElementById('start-button').addEventListener('click', () => {	
    startGame()
});

const leftButton = document.getElementById('left-button');
const rightButton = document.getElementById('right-button');
const gameOverScreen = document.getElementById('game-over-screen');
const finalScore = document.getElementById('final-score');
const restartButton = document.getElementById('restart-button');

leftButton.addEventListener('touchstart', () => moveLeft = true);
leftButton.addEventListener('touchend', () => moveLeft = false);

rightButton.addEventListener('touchstart', () => moveRight = true);
rightButton.addEventListener('touchend', () => moveRight = false);

let moveLeft = false;
let moveRight = false;

let ballVelocityY = 0; // Vertical velocity of the ball
let score = 0;
let gameStarted = false;

const minAsteroids = 5; // Set a minimum number of asteroids

const textureLoader = new THREE.TextureLoader();
const platformTexture = textureLoader.load('res/platform_texture.jpg');

const explosionSound = new Howl({
    src: ['res/explosion.mp3']
});

const hitSound = new Howl({
    src: ['res/hit.mp3']
});

const gameOverSound = new Howl({
    src: ['res/gameover.mp3']
});

function startGame() {	
    document.getElementById('splash-screen').style.display = 'none';
	document.getElementById('score').style.display = 'block';
	document.getElementById('left-button').style.display = 'block';
	document.getElementById('right-button').style.display = 'block';
	
    gameStarted = true;
	
    init();
    animate();
}

function init() {
    // Create scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);

    // Create camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5;

    // Create renderer
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);

	document.getElementById('game-container').appendChild(renderer.domElement);

    // Create ball
    const geometry = new THREE.SphereGeometry(0.2, 32, 32);
    const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    ball = new THREE.Mesh(geometry, material);
    ball.position.y = startY; // Starting position above the visible screen
    scene.add(ball);

    // Create initial platforms
    platforms = [];
	createPlatforms();
	
    // Create stars
    stars = [];
    for (let i = 0; i < starCount; i++) {
        const starGeometry = new THREE.SphereGeometry(0.05, 12, 12);
        const starMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
        const star = new THREE.Mesh(starGeometry, starMaterial);
        star.position.x = (Math.random() - 0.5) * 20;
        star.position.y = (Math.random() - 0.5) * 20;
        star.position.z = (Math.random() - 0.5) * 20;
        scene.add(star);
        stars.push(star);
    }

    // Create asteroids
    asteroids = [];
    const asteroidCount = Math.floor(Math.random() * maxAsteroids);
	spawnAsteroids(minAsteroids);

    // Create clock for animation
    clock = new THREE.Clock();

    // Get score element
    scoreElement = document.getElementById('score');
	
	// Reset the score
    score = 0;
	scoreElement.textContent = `Score: ${score}`;
	
    // Debugging logs
    console.log('Scene:', scene);
    console.log('Camera:', camera);
    console.log('Renderer:', renderer);
    console.log('Ball:', ball);
    console.log('Platforms:', platforms);
    console.log('Stars:', stars);
    console.log('Asteroids:', asteroids);
}

function createPlatforms() {
    for (let i = 0; i < 5; i++) {
        const platformGeometry = new THREE.BoxGeometry(1, 0.1, 1);
        const platformMaterial = new THREE.MeshBasicMaterial({ map: platformTexture });
		//const platformMaterial = new THREE.MeshBasicMaterial({ color: 0x0000ff });
        const platform = new THREE.Mesh(platformGeometry, platformMaterial);
        platform.position.x = (Math.random() - 0.5) * 10;
        platform.position.y = (Math.random() - 0.5) * -5;
        platform.dx = (Math.random() - 0.5) * platformSpeed;
        scene.add(platform);
        platforms.push(platform);
    }
}

function spawnAsteroids(count) {
    for (let i = 0; i < count; i++) {
        const asteroidGeometry = new THREE.SphereGeometry(0.1, 12, 12);
        const asteroidMaterial = new THREE.MeshBasicMaterial({ color: 0x888888 });
        const asteroid = new THREE.Mesh(asteroidGeometry, asteroidMaterial);
        asteroid.position.x = (Math.random() - 0.5) * 20;
        asteroid.position.y = (Math.random() - 0.5) * 20;
        asteroid.dx = (Math.random() - 0.5) * 0.1;
        asteroid.dy = (Math.random() - 0.5) * 0.1;
        scene.add(asteroid);
        asteroids.push(asteroid);
    }
}

function animate() {
    if (!gameStarted) return;

    requestAnimationFrame(animate);
	
	// Update ball position based on virtual buttons
    if (moveLeft) {
        ball.position.x -= 0.05;
    }
    if (moveRight) {
        ball.position.x += 0.05;
    }

    const delta = clock.getDelta();

    // Apply gravity to the ball
    ballVelocityY -= gravity * delta;

    // Move ball
    if (moveLeft) ball.position.x -= ballSpeed * delta;
    if (moveRight) ball.position.x += ballSpeed * delta;
    ball.position.y += ballVelocityY * delta;

    // Move platforms
    platforms.forEach((platform, index) => {
        platform.position.x += platform.dx;
        if (platform.position.x > 5 || platform.position.x < -5) {
            platform.dx = -platform.dx;
        }

        // Check for collision with the ball
        if (
            ball.position.x > platform.position.x - 0.5 &&
            ball.position.x < platform.position.x + 0.5 &&
            ball.position.y < platform.position.y + 0.1 &&
            ball.position.y > platform.position.y - 0.1 &&
            ballVelocityY <= 0 // Ensure the ball is falling downwards when checking for collision
        ) {
			// Play hit sound
            hitSound.play();
			
            ballVelocityY = bounceVelocity;
            ball.position.y = platform.position.y + 0.2; // Prevent clipping through the platform
            
			onBallHitPlatform()
        }
    });

    // Move asteroids
    asteroids.forEach((asteroid, asteroidIndex) => {
        asteroid.position.x += asteroid.dx;
        asteroid.position.y += asteroid.dy;

        // Check for collision with platforms
        platforms.forEach((platform, platformIndex) => {
            if (
                asteroid.position.x > platform.position.x - 0.5 &&
                asteroid.position.x < platform.position.x + 0.5 &&
                asteroid.position.y > platform.position.y - 0.1 &&
                asteroid.position.y < platform.position.y + 0.1
            ) {
				// Play explosion sound
                explosionSound.play();
				
                // Remove the platform and asteroid
                scene.remove(platform);
                scene.remove(asteroid);
                platforms.splice(platformIndex, 1);
                asteroids.splice(asteroidIndex, 1);

                // Spawn a new platform
                spawnPlatform();

                // Spawn a new asteroid
                spawnAsteroids(1);
            }
        });

        // Check if asteroid leaves the visible screen
        if (asteroid.position.x < -10 || asteroid.position.x > 10 || asteroid.position.y < -10 || asteroid.position.y > 10) {
            scene.remove(asteroid);
            asteroids.splice(asteroidIndex, 1);

            // Spawn a new asteroid
            spawnAsteroids(1);
        }
    });

    // Ensure the number of asteroids is within the desired range
    while (asteroids.length < minAsteroids) {
        spawnAsteroids(1);
    }

    while (asteroids.length > maxAsteroids) {
        const excessAsteroid = asteroids.pop();
        scene.remove(excessAsteroid);
    }

    // Check if the ball has fallen off the screen
    if (ball.position.y < -5) {
		gameStarted = false;
				
		displayGameOver();		
    }

    renderer.render(scene, camera);
}

function displayGameOver() {
	// Play game over sound
    gameOverSound.play();
	
    finalScore.textContent = `Final Score: ${score}`;
    gameOverScreen.style.display = 'flex';
}

restartButton.addEventListener('click', () => {
    resetGame();
});

function spawnPlatform() {
    const platformGeometry = new THREE.BoxGeometry(1, 0.1, 1);
    const platformMaterial = new THREE.MeshBasicMaterial({ map: platformTexture });
	//const platformMaterial = new THREE.MeshBasicMaterial({ color: 0x0000ff });
    const newPlatform = new THREE.Mesh(platformGeometry, platformMaterial);
	
    newPlatform.position.x = (Math.random() - 0.5) * 10;
    newPlatform.position.y = -1.5;
    newPlatform.dx = (Math.random() - 0.5) * platformSpeed;
	
    scene.add(newPlatform);
    platforms.push(newPlatform);
}

function resetGame() {
	gameOverScreen.style.display = 'none';
	
    ball.position.set(0, startY, 0);
    ballVelocityY = 0; // Reset ball velocity
    score = 0;
    scoreElement.textContent = `Score: ${score}`;
    platforms.forEach(platform => {
        platform.position.x = (Math.random() - 0.5) * 10;
        platform.position.y = (Math.random() - 0.5) * -5;
        platform.dx = (Math.random() - 0.5) * platformSpeed;
    });

    // Respawn asteroids
    asteroids.forEach(asteroid => scene.remove(asteroid));
    asteroids = [];
    spawnAsteroids(minAsteroids);
	
	gameStarted = true;
	animate();
}

function onBallHitPlatform() {
    score++;
    scoreElement.textContent = `Score: ${score}`;
}
