(() => {
    const canvas = document.getElementById('game');
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;

    let speed = 2;
    let gravity = 0.6;
    let running = false;
    let gameOver = false;
    let score = 0;
    let highScore = 0;

    const dino = {
      x: 60, y: H - 48 - 20, w: 44, h: 44, vy: 0, jumping: false, ducking: false
    };

    let obstacles = [];
    let spawnTimer = 0;

    function reset() {
      speed = 4;
      running = true;
      gameOver = false;
      score = 0;
      obstacles = [];
      dino.y = H - 48 - 20; dino.vy = 0; dino.jumping = false; dino.ducking = false;
      spawnTimer = 0;
    }

    document.addEventListener('keydown', e => {
      if (e.code === 'Space' || e.code === 'ArrowUp') jump();
      if (e.code === 'ArrowDown') duck(true);
      if (e.code === 'KeyR') reset();
    });
    document.addEventListener('keyup', e => { if (e.code === 'ArrowDown') duck(false); });

    canvas.addEventListener('touchstart', e => {
      e.preventDefault();
      if (!running) reset();
      jump();
    }, {passive:false});

    function jump() {
      if (gameOver) return;
      if (!running) { reset(); return; }
      if (!dino.jumping) {
        dino.vy = -10.5;
        dino.jumping = true;
        dino.ducking = false;
      }
    }
    function duck(state){
      if (gameOver) return;
      dino.ducking = !!state;
      dino.h = dino.ducking ? 28 : 44;
      dino.y = H - 48 - dino.h;
    }

    function spawnObstacle() {
      if (Math.random() < 0.75) {
        const size = 20 + Math.random()*20;
        obstacles.push({x: W + 10, y: H - 48 - size, w: Math.round(size*0.8), h: Math.round(size), type: 'cactus'});
      } else {
        const birdHeight = [H-90, H-120][Math.floor(Math.random()*2)];
        obstacles.push({x: W + 10, y: birdHeight, w: 40, h: 24, type: 'bird', frame: 0});
      }
    }

    function update(dt) {
      if (!running) return;
      speed += 0.0002 * dt;

      dino.vy += gravity;
      dino.y += dino.vy;
      if (dino.y >= H - 48 - dino.h) { dino.y = H - 48 - dino.h; dino.vy = 0; dino.jumping = false; }

      spawnTimer += dt;
      const interval = Math.max(1000 - speed*25, 500);
      if (spawnTimer > interval) { spawnTimer = 0; spawnObstacle(); }

      for (let i = obstacles.length - 1; i >= 0; i--) {
        const o = obstacles[i];
        o.x -= speed;
        if (o.x + o.w < -50) obstacles.splice(i,1);
        if (rectIntersect(dino, o)) { gameOver = true; running = false; if (score > highScore) highScore = score; }
        if (o.type === 'bird') o.frame = (o.frame + 1) % 20;
      }

      score += Math.floor(dt * 0.02 * speed);
    }

    function rectIntersect(a,b){
      return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
    }

    function draw() {
      ctx.clearRect(0,0,W,H);
      ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--grad-top');
      ctx.fillRect(0,0,W,H);

      ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--ground');
      ctx.fillRect(0,H-48,W,48);
      ctx.strokeStyle = '#555';
      ctx.beginPath(); ctx.moveTo(0,H-48); ctx.lineTo(W,H-48); ctx.stroke();

      ctx.save();
      ctx.translate(dino.x, dino.y);
      ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--fg');
      ctx.fillRect(0,0,dino.w,dino.h);
      ctx.fillStyle = '#fff';
      ctx.fillRect(dino.w-12,8,6,6);
      ctx.fillRect(-6,dino.h-8,10,8);
      ctx.fillRect(dino.w-8,dino.h-8,10,8);
      ctx.restore();

      obstacles.forEach(o => {
        if (o.type === 'cactus') {
          ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--fg');
          ctx.fillRect(o.x, o.y, o.w, o.h);
        } else if (o.type === 'bird') {
          ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--fg');
          ctx.beginPath();
          ctx.moveTo(o.x, o.y+12);
          ctx.lineTo(o.x+20, o.y + (o.frame<10 ? 0 : 24));
          ctx.lineTo(o.x+40, o.y+12);
          ctx.closePath();
          ctx.fill();
        }
      });

      ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--fg');
      ctx.font = '14px monospace';
      ctx.fillText('Distance: ' + score, 10, 18);
      ctx.fillText('Highscore: ' + highScore, W - 150, 18);

      if (!running && !gameOver) {
        ctx.fillStyle = 'rgba(0,0,0,0.06)';
        ctx.fillRect(0,0,W,H);
        ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--fg');
        ctx.font = '16px system-ui';
        ctx.fillText('Appuie sur Espace pour démarrer', W/2 - 150, H/2 + 6);
      }

      if (gameOver) {
        ctx.fillStyle = 'rgba(0,0,0,0.35)';
        ctx.fillRect(0,0,W,H);
        ctx.fillStyle = '#fff';
        ctx.font = '28px system-ui';
        ctx.fillText('Game Over', W/2 - 80, H/2 - 10);
        ctx.font = '16px system-ui';
        ctx.fillText('Appuie sur Recommencer pour retenter', W/2 - 120, H/2 + 18);
      }
    }

    let last = performance.now();
    function loop(now) {
      const dt = now - last;
      last = now;
      update(dt);
      draw();
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);

    document.getElementById('restart').addEventListener('click', reset);

    const themeBtn = document.getElementById('themeToggle');
    themeBtn.addEventListener('click', () => {
      const body = document.body;
      if (body.getAttribute('data-theme') === 'light') {
        body.setAttribute('data-theme','dark');
        themeBtn.textContent = 'Mode clair';
      } else {
        body.setAttribute('data-theme','light');
        themeBtn.textContent = 'Mode sombre';
      }
    });

    draw();
  })();