import { TinyColor } from '@ctrl/tinycolor';
import anime from 'animejs';

export function getCoordsFromEvent(e) {
  const pointerX = 'clientX' in e
    ? e.clientX
    : (e.touches[0] ? e.touches[0].clientX : e.changedTouches[0].clientX);
  
  const pointerY = 'clientY' in e
    ? e.clientY
    : (e.touches[0] ? e.touches[0].clientY : e.changedTouches[0].clientY);

  return { x: pointerX, y: pointerY };
}

export function setCanvasSize(canvasEl, width = window.innerWidth, height = window.innerHeight) {
  canvasEl.width = width;
  canvasEl.height = height;
  canvasEl.style.width = `${width}px`;
  canvasEl.style.height = `${height}px`;
}

export function createFireworks(config) {
  const {
    selector = 'canvas.fireworks',
    numberOfParticles = 10,
    circleRadius = { min: 5, max: 10 },
    diffuseRadius = { min: 20, max: 40 },
    orbitRadius = { min: 20, max: 40 },
    animeDuration = { min: 500, max: 1500 },
    particleColors = ['#D61C59', '#E7D84B', '#1B8798'], // 粒子颜色
    particleSize = 21, // 粒子大小
    particleSymbol = '✦', // 粒子符号
    enableParticleTrail = true, // 是否启用粒子拖尾效果
  } = config;

  const colors = config.colors?.length > 0 ? config.colors : ['#66A7DD', '#3E83E1', '#214EC2'];

  const canvasEl = document.querySelector(selector);
  const ctx = canvasEl.getContext('2d');
  
  if (!ctx) return;

  // ================== 粒子拖尾效果 ==================
  const trailCanvas = document.createElement('canvas');
  const trailCtx = trailCanvas.getContext('2d');
  const trailParticles = [];
  const particleCanvases = [];
  let lastPosition = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  
  // 设置粒子画布样式
  trailCanvas.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    pointer-events: none;
    z-index: 9999;
  `;
  document.body.appendChild(trailCanvas);
  
  // 初始化粒子画布
  function initTrailCanvas() {
    setCanvasSize(trailCanvas);
    
    // 创建粒子纹理
    trailCtx.font = `${particleSize}px serif`;
    trailCtx.textBaseline = 'middle';
    trailCtx.textAlign = 'center';
    
    particleColors.forEach(color => {
      const textMetrics = trailCtx.measureText(particleSymbol);
      const particleCanvas = document.createElement('canvas');
      const particleCtx = particleCanvas.getContext('2d');
      
      particleCanvas.width = textMetrics.width;
      particleCanvas.height = textMetrics.actualBoundingBoxAscent + textMetrics.actualBoundingBoxDescent;
      
      particleCtx.fillStyle = color;
      particleCtx.textAlign = 'center';
      particleCtx.font = `${particleSize}px serif`;
      particleCtx.textBaseline = 'middle';
      particleCtx.fillText(particleSymbol, particleCanvas.width / 2, textMetrics.actualBoundingBoxAscent);
      
      particleCanvases.push(particleCanvas);
    });
  }
  
  // 创建单个粒子
  function createTrailParticle(x, y) {
    const initialLifeSpan = Math.floor(30 * Math.random() + 60);
    
    return {
      initialLifeSpan,
      lifeSpan: initialLifeSpan,
      velocity: {
        x: (Math.random() < 0.5 ? -1 : 1) * (Math.random() / 2),
        y: 0.7 * Math.random() + 0.9
      },
      position: { x, y },
      canvas: particleCanvases[Math.floor(Math.random() * particleCanvases.length)],
      update() {
        this.position.x += this.velocity.x;
        this.position.y += this.velocity.y;
        this.lifeSpan--;
        this.velocity.y += 0.02;
        
        const scale = Math.max(this.lifeSpan / this.initialLifeSpan, 0);
        
        trailCtx.drawImage(
          this.canvas,
          this.position.x - (this.canvas.width / 2) * scale,
          this.position.y - this.canvas.height / 2,
          this.canvas.width * scale,
          this.canvas.height * scale
        );
      }
    };
  }
  
  // 添加粒子
  function addTrailParticles(x, y) {
    if (Math.hypot(x - lastPosition.x, y - lastPosition.y) > 1.5) {
      trailParticles.push(createTrailParticle(x, y));
      lastPosition = { x, y };
    }
  }
  
  // 更新粒子动画
  function updateTrailParticles() {
    trailCtx.clearRect(0, 0, trailCanvas.width, trailCanvas.height);
    
    for (let i = 0; i < trailParticles.length; i++) {
      trailParticles[i].update();
    }
    
    // 移除生命周期结束的粒子
    for (let i = trailParticles.length - 1; i >= 0; i--) {
      if (trailParticles[i].lifeSpan < 0) {
        trailParticles.splice(i, 1);
      }
    }
    
    requestAnimationFrame(updateTrailParticles);
  }
  
  // ================== 烟花效果 ==================
  function setParticleDirection(p) {
    const angle = (anime.random(0, 360) * Math.PI) / 180;
    const value = anime.random(diffuseRadius.min, diffuseRadius.max);
    const radius = [-1, 1][anime.random(0, 1)] * value;
    
    return {
      x: p.x + radius * Math.cos(angle),
      y: p.y + radius * Math.sin(angle),
    };
  }

  function createFireworkParticle(x, y) {
    const tinyColor = new TinyColor(colors[anime.random(0, colors.length - 1)]);
    tinyColor.setAlpha(anime.random(0.2, 0.8));

    const p = {
      x,
      y,
      color: tinyColor.toRgbString(),
      radius: anime.random(circleRadius.min, circleRadius.max),
      endPos: setParticleDirection({ x, y }),
      draw: () => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, 2 * Math.PI, true);
        ctx.fillStyle = p.color;
        ctx.fill();
      }
    };
    
    return p;
  }

  function renderParticle(anim) {
    for (let i = 0; i < anim.animatables.length; i++) {
      anim.animatables[i].target.draw();
    }
  }

  function animateParticles(pos) {
    const particles = Array.from({ length: numberOfParticles }, () => 
      createFireworkParticle(pos.x, pos.y)
    );

    anime.timeline().add({
      targets: particles,
      x(p) { return p.endPos.x; },
      y(p) { return p.endPos.y; },
      radius: 0.1,
      duration: anime.random(animeDuration.min, animeDuration.max),
      easing: 'easeOutExpo',
      update: renderParticle,
    }).add({
      radius: anime.random(orbitRadius.min, orbitRadius.max),
      lineWidth: 0,
      alpha: {
        value: 0,
        easing: 'linear',
        duration: anime.random(600, 800),
      },
      duration: anime.random(1200, 1800),
      easing: 'easeOutExpo',
      update: renderParticle,
    }, 0);
  }

  const render = anime({
    duration: Number.POSITIVE_INFINITY,
    update: () => {
      ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);
    },
  });

  // ================== 事件处理 ==================
  function handlePointerMove(e) {
    if (!enableParticleTrail) return;
    
    const pos = getCoordsFromEvent(e);
    addTrailParticles(pos.x, pos.y);
  }

  function handlePointerDown(e) {
    render.play();
    const pos = getCoordsFromEvent(e);
    const rect = canvasEl.getBoundingClientRect();
    
    animateParticles({
      x: pos.x - rect.left,
      y: pos.y - rect.top,
    });
  }

  function handleResize() {
    setCanvasSize(canvasEl);
    setCanvasSize(trailCanvas);
  }

  // ================== 初始化 ==================
  function init() {
    setCanvasSize(canvasEl);
    
    if (enableParticleTrail) {
      initTrailCanvas();
      updateTrailParticles();
    }

    // 添加事件监听
    document.addEventListener('mousemove', handlePointerMove);
    document.addEventListener('touchmove', handlePointerMove, { passive: true });
    document.addEventListener('touchstart', handlePointerMove, { passive: true });
    document.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('resize', handleResize);
    
    // 返回清理函数
    return () => {
      document.removeEventListener('mousemove', handlePointerMove);
      document.removeEventListener('touchmove', handlePointerMove);
      document.removeEventListener('touchstart', handlePointerMove);
      document.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('resize', handleResize);
      
      if (trailCanvas.parentNode) {
        trailCanvas.parentNode.removeChild(trailCanvas);
      }
    };
  }

  // 返回清理函数
  return init();
}