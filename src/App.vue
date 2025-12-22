<template>
  <div style="width: 100%; height: 100%">
    <canvas id="canvas"></canvas>
    <canvas class="fireworks" />
    <router-view v-slot="{ Component }">
      <transition name="fade">
        <component :is="Component" />
      </transition>
    </router-view>
  </div>
</template>
<script setup>
import { onMounted } from "vue";
import { createFireworks } from "./utils/fire.js";
onMounted(() => {
  createFireworks({
    selector: "canvas.fireworks",
    colors: [
      "#FF6347",
      "#FF8C00",
      "#FFD700",
      "#32CD32",
      "#00BFFF",
      "#FF1493",
      "#9400D3",
      "#4169E1",
      "#FF4500",
      "#00FA9A",
    ],
  });

  const canvas = document.getElementById("canvas");
  const ctx = canvas.getContext("2d");

  // 窗口尺寸调整处理函数
  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener("resize", resize);
  resize(); // 初始化尺寸

  // 心形参数方程（数学公式）
  function heart(t) {
    const x = 16 * Math.pow(Math.sin(t), 3); // x坐标计算
    const y =
      -13 * Math.cos(t) +
      5 * Math.cos(2 * t) +
      2 * Math.cos(3 * t) +
      Math.cos(4 * t); // y坐标计算
    return { x, y };
  }

  // 爱心粒子类
  class Heart {
    constructor() {
      this.reset(); // 初始化时重置属性
    }

    reset() {
      // 粒子重置到初始状态
      this.progress = 0; // 动画进度
      this.size = Math.random() * 12 + 8; // 尺寸随机（8-20）
      this.speed = Math.random() * 0.006 + 0.0002; // 速度调慢（原0.01-0.03）
      this.color = `hsl(${Math.random() * 360}, 100%, 70%)`; // 随机HSL颜色
      this.position = {
        x: Math.random() * canvas.width, // 初始X位置
        y: canvas.height + 50, // 从屏幕底部开始
      };
    }

    update() {
      // 更新粒子位置
      this.progress += this.speed;
      // 垂直运动（贝塞尔曲线）
      this.position.y = canvas.height - this.progress * canvas.height * 1.2;
      // 水平摆动
      this.position.x += Math.sin(this.progress * Math.PI * 2) * 2;

      // 超过屏幕后重置
      if (this.position.y < -50) this.reset();
    }

    draw() {
      // 绘制单个爱心
      ctx.save();
      ctx.translate(this.position.x, this.position.y);
      ctx.scale(this.size / 20, this.size / 20); // 缩放控制大小

      // 绘制心形路径
      ctx.beginPath();
      for (let t = 0; t < 2 * Math.PI; t += 0.01) {
        const { x, y } = heart(t);
        ctx.lineTo(x * 1.2, y * 1.2);
      }

      // 样式设置
      ctx.fillStyle = this.color;
      ctx.shadowColor = this.color;
      ctx.shadowBlur = 15; // 发光效果
      ctx.globalAlpha = 1 - this.progress / 1.5; // 透明度渐变
      ctx.fill();
      ctx.restore();
    }
  }

  // 创建爱心数组（60个粒子）
  const hearts = Array.from({ length: 60 }, () => new Heart());

  // 绘制居中名字
  function drawName() {
    ctx.save();
    ctx.font = "bold 48px Arial"; // 字体设置
    ctx.fillStyle = "rgba(255, 255, 255, 0.9)"; // 半透明白色
    ctx.textAlign = "center"; // 水平居中
    ctx.textBaseline = "middle"; // 垂直居中
    ctx.shadowColor = "rgba(255, 0, 0, 0.5)"; // 红色阴影
    ctx.shadowBlur = 10;
    // ctx.fillText('Happy every day~', canvas.width / 2, canvas.height / 2); // 居中显示
    ctx.restore();
  }

  // 动画循环
  function animate() {
    // 清空画布（使用半透明填充实现拖尾效果）
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 更新和绘制所有爱心
    hearts.forEach((heart) => {
      heart.update();
      heart.draw();
    });

    drawName(); // 绘制名字

    requestAnimationFrame(animate); // 下一帧循环
  }

  // 鼠标交互：爱心排斥效果
  canvas.addEventListener("mousemove", (e) => {
    hearts.forEach((heart) => {
      const dx = e.clientX - heart.position.x;
      const dy = e.clientY - heart.position.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 100) {
        // 距离小于100px时生效
        heart.position.x += dx * 0.03; // X轴偏移
        heart.position.y += dy * 0.03; // Y轴偏移
      }
    });
  });

  // animate()
});
</script>
<style scoped>
#canvas {
  display: block;
  position: fixed;
  left: 0;
  top: 0;
  z-index: 999;
  pointer-events: none;
}

canvas.fireworks {
  position: fixed;
  left: 0;
  top: 0;
  width: 100vw;
  height: 100vh;
  z-index: 999;
  pointer-events: none;
}
.fade-enter-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
.fade-leave-active {
  display: none;
}
.fade-leave-from {
  display: none;
}
.fade-leave-to {
  display: none;
}
</style>
