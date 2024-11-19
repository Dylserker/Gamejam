import Phaser from './lib/phaser.js'
console.dir(Phaser);

const config = {
    type: Phaser.AUTO,
    width: 1200,
    height: 800,
    backgroundColor: "#1d1d1d",
    physics: {
        default: "arcade",
        arcade: {
            debug: false,
        },
    },
    scene: {
        preload,
        create,
        update,
    },
};


let player;
let cursors;
let enemies;
let bullets;
let lastFired = 0;
let score = 0;
let scoreText;
let spawnTimer = 0;
let difficultyMultiplier = 1;
let gameOverText;
let music; // Variable pour la musique

function preload() {
    this.load.image("player", "img/neko.png"); // Remplace par un sprite
    this.load.image("enemy", "img/ghost.png"); // Remplace par un sprite
    this.load.image("bullet", "img/energy.png"); // Remplace par un sprite
    this.load.image("background", "img/map.png"); // Chemin vers votre fichier PNG
    this.load.audio("backgroundMusic", "media/ambience.mp3"); // Musique de fond
    this.load.audio("enemyDestroy", "media/dead.mp3"); // Chemin vers le fichier son
    this.load.audio("defeat", "media/defeat.mp3");
    this.load.spritesheet("blast", "img/sheet.png", {
        frameWidth: 48,
        frameHeight: 48,
    })
}

function create() {
    // Ajouter l'image du fond
    this.add.image(600, 400, "background"); // Positionner au centre de l'écran

    // Jouer la musique de fond
    music = this.sound.add("backgroundMusic");
    music.play({ loop: true, volume: 0.5 }); // Volume réduit et boucle activée

    // Ajouter l'image du fond et ajuster sa taille à la taille de l'écran
    const background = this.add.image(600, 400, "background");
    background.setDisplaySize(1200, 800); // Redimensionner l'image pour couvrir toute la scène

    // Ajout d'une bordure visuelle
    this.add.rectangle(600, 400, 1200, 800).setStrokeStyle(2, 0xffffff);

    // Ajout du joueur
    player = this.physics.add.sprite(400, 300, "player");
    player.setCollideWorldBounds(true);

    // Groupe pour les ennemis
    enemies = this.physics.add.group();

    // Groupe pour les tirs
    bullets = this.physics.add.group();

    // Ajout des contrôles clavier
    cursors = this.input.keyboard.createCursorKeys();

    // Texte pour le score
    scoreText = this.add.text(10, 10, "Score: 0", {
        fontSize: "20px",
        fill: "#ffffff",
    });

    gameOverText = this.add.text(600, 400, "", {
        fontSize: "40px",
        fill: "#ff0000",
    });
    gameOverText.setOrigin(0.5);
    gameOverText.setVisible(false);

    // Collision entre les balles et les ennemis
    this.physics.add.overlap(bullets, enemies, destroyEnemy, null, this);

    // Collision entre le joueur et les ennemis
    this.physics.add.overlap(player, enemies, hitPlayer, null, this);

    this.anims.create({
        key:"blast",
        frames: this.anims.generateFrameNumbers("blast",{frames:[0,1,2,3,]}),
        frameRate: 12,
        repeat: -1
    })
}

function update(time) {
    // Vérifie si le jeu est terminé
    if (gameOverText.visible) return;
    // Mouvement du joueur
    player.setVelocity(0);
    if (cursors.left.isDown) player.setVelocityX(-450);
    if (cursors.right.isDown) player.setVelocityX(450);
    if (cursors.up.isDown) player.setVelocityY(-450);
    if (cursors.down.isDown) player.setVelocityY(450);

    // Tir automatique
    if (time > lastFired) {
        shootBullet.call(this, player.x, player.y);
        lastFired = time + 400; // Cadence de tir (400ms)
    }

    // Apparition des ennemis
    if (time > spawnTimer) {
        spawnEnemy.call(this);
        spawnTimer = time + Math.max(400,800 / difficultyMultiplier); // Intervalle de spawn
    }

    // Vérifie si un ennemi touche le bas de l'écran
    enemies.getChildren().forEach((enemy) => {
        if (enemy.y > 800) {
            endGame.call(this);
        }
    });
}

function shootBullet(x, y) {
    const bulletSprite = this.add.sprite(48,48, "blast")
    const bullet = bullets.create(x, y, "bullet");
    bullet.visible = false
    bulletSprite.play("blast", true)

    bullet.setVelocityY(-300);
    bullet.setCollideWorldBounds(true);
    bullet.body.onWorldBounds = true; // Active l'écouteur de bord
    bullet.on("worldbounds", () => {
        bullet.ondestroy()
    });

    const loop = ()=>{
        bulletSprite.x = bullet.body.x + 12
        bulletSprite.y = bullet.body.y;
        if(bullet.body.y <= 0) bullet.ondestroy()
        requestAnimationFrame(loop)
    }
    loop()

    bullet.ondestroy = ()=> {
        bullet.destroy()
        bulletSprite.destroy();
        cancelAnimationFrame(loop);
    }
}

function spawnEnemy() {
    const x = Phaser.Math.Between(50, 1150);
    const enemy = enemies.create(x, 0, "enemy");
    enemy.setVelocity(0, 100); // Descend à une vitesse constante
}

function destroyEnemy(bullet, enemy) {
    bullet.ondestroy()
    enemy.destroy();
    // Jouer le son de destruction
    this.sound.play("enemyDestroy", { volume: 0.7 });
    score += 10;
    difficultyMultiplier += 0.01;
    scoreText.setText("Score: " + score);
}

// Gère la collision entre le joueur et un ennemi
function hitPlayer(player, enemy) {
    endGame.call(this);
}

// Termine la partie
function endGame() {
    gameOverText.setText("Game Over");
    gameOverText.setVisible(true);
    this.physics.pause();
    music.stop(); // Arrête la musique à la fin du jeu
    this.sound.play("defeat", { volume: 1 });

    this.input.keyboard.once("keydown-R", () => {
        this.scene.restart();
        score=0;
        difficultyMultiplier = 1;
    })
}

function createPlayButton(){
    const button = document.createElement("button")
    button.innerHTML = "PLAY"
    document.addEventListener("DOMContentLoaded", ()=>{
        document.body.append(button)
        button.addEventListener("click", ()=>{
            const game = new Phaser.Game(config);
            button.remove()
        })
    })
}

createPlayButton()
