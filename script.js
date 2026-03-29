const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

let particles = [];
let textParticles = [];
let rockets = [];

// ================= PARTICLE =================
class Particle {
    constructor(x, y, angle, speed, color, size = 2, gravity = 0.04, decay = 0.01, delay = 0) {
        this.x = x;
        this.y = y;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.color = color;
        this.alpha = 1;
        this.size = size;
        this.gravity = gravity;
        this.decay = decay;
        this.delay = delay; // Frames to wait before fading/moving
    }

    update() {
        if (this.delay > 0) {
            this.delay--;
            return; // Stay still and opaque during delay
        }

        this.vy += this.gravity;
        this.vx *= 0.99; 
        this.x += this.vx;
        this.y += this.vy;
        this.alpha -= this.decay;
    }

    draw() {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;
        ctx.shadowBlur = this.delay > 0 ? 15 : 5; 
        ctx.shadowColor = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

// ================= ROCKET =================
class Rocket {
    constructor(x, targetY, isTextRocket = false) {
        this.x = x;
        this.y = canvas.height;
        this.targetY = targetY;
        this.isTextRocket = isTextRocket;
        this.velocity = -8 - Math.random() * 5; 
        this.friction = 0.985; 
        this.exploded = false;
        this.hue = isTextRocket ? 300 : Math.random() * 360;
    }

    update() {
        this.velocity *= this.friction;
        this.y += this.velocity;

        if (Math.random() > 0.2) {
            particles.push(new Particle(
                this.x, this.y, 
                Math.PI / 2 + (Math.random() - 0.5) * 0.2, 
                Math.random() * 2, 
                `hsla(${this.hue}, 100%, 70%, 1)`, 
                1.2, 0.02, 0.03
            ));
        }

        if (this.velocity >= -1.5 || this.y <= this.targetY) {
            this.exploded = true;
            if (this.isTextRocket) {
                createExplodingText(this.x, this.y);
            } else {
                explodeHeart(this.x, this.y);
            }
        }
    }

    draw() {
        ctx.save();
        ctx.fillStyle = "white";
        ctx.beginPath();
        ctx.arc(this.x, this.y, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

// ================= HEART EXPLOSION =================
function explodeHeart(x, y) {
    for (let i = 0; i < 100; i++) {
        let t = (i / 100) * Math.PI * 2;
        let heartX = 16 * Math.pow(Math.sin(t), 3);
        let heartY = -(13 * Math.cos(t) - 5 * Math.cos(2*t) - 2 * Math.cos(3*t) - Math.cos(4*t));
        
        let angle = Math.atan2(heartY, heartX);
        let speed = Math.random() * 3 + 2;
        let color = `hsl(${330 + Math.random() * 30}, 100%, 65%)`;

        particles.push(new Particle(x, y, angle, speed, color, 2, 0.05, 0.01));
    }
}

// ================= TEXT LOGIC =================
function createExplodingText(targetX, targetY) {
    const tempCanvas = document.createElement("canvas");
    const tempCtx = tempCanvas.getContext("2d");
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;

    const fontSize = Math.min(canvas.width / 12, 60);
    tempCtx.font = `bold ${fontSize}px Arial`;
    tempCtx.fillStyle = "white";
    tempCtx.textAlign = "center";
    tempCtx.fillText("I Miss You My Tsuki:(", targetX, targetY);

    const data = tempCtx.getImageData(0, 0, canvas.width, canvas.height);

    for (let y = 0; y < canvas.height; y += 4) {
        for (let x = 0; x < canvas.width; x += 4) {
            const i = (y * canvas.width + x) * 4;
            if (data.data[i + 3] > 128) {
                let angle = Math.random() * Math.PI * 2;
                let speed = Math.random() * 1.5; 
                
                // 300 frames ≈ 5 seconds at 60fps
                textParticles.push(
                    new Particle(x, y, angle, speed, "#ffb3ff", 2, 0.01, 0.02, 180)
                );
            }
        }
    }
}

function launchFirework() {
    let x = Math.random() * canvas.width;
    let targetY = canvas.height * 0.2 + (Math.random() * canvas.height * 0.3);
    rockets.push(new Rocket(x, targetY, false));
}

function launchTextRocket() {
    rockets.push(new Rocket(canvas.width / 2, canvas.height / 2.5, true));
}

// ================= ANIMATION =================
function animate() {
    ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    rockets = rockets.filter(r => !r.exploded);
    rockets.forEach(r => { r.update(); r.draw(); });

    particles = particles.filter(p => p.alpha > 0);
    particles.forEach(p => { p.update(); p.draw(); });

    textParticles = textParticles.filter(p => p.alpha > 0);
    textParticles.forEach(p => { p.update(); p.draw(); });

    requestAnimationFrame(animate);
}

animate();

// ================= TIMING =================
setInterval(launchFirework, 1500); 
setInterval(launchTextRocket, 10000);