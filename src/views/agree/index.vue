<template>
  <div class="container">
    <!-- 头像区域 -->
    <div class="avatar" ref="avatarRef">
      <div class="eyes">
        <div class="eye">
          <div class="pupil" :style="{ transform: pupilTransform }"></div>
        </div>
        <div class="eye">
          <div class="pupil" :style="{ transform: pupilTransform }"></div>
        </div>
      </div>
      <div class="mouth" :class="mouthClass">
        <div v-if="isShow" class="ya"></div>
        <div v-if="isShow" class="nei"></div>
        <div v-if="isShowLine" class="linebox">
          <div class="line"></div>
          <div class="line"></div>
          <div class="line"></div>
          <div class="line"></div>
        </div>
      </div>
    </div>

    <!-- 按钮区域 -->
    <div class="buttons" ref="buttonsRef">
      <button
        class="btn btn-agree"
        @mouseenter="handleAgreeEnter"
        @mouseleave="handleAgreeLeave"
        @click="handleAgreeClick"
        :disabled="isAgreed"
        :style="{ opacity: isAgreed ? 0.8 : 1 }"
      >
        同意
      </button>
      <!-- 拒绝按钮改为fixed定位，绑定ref -->
      <button
        class="btn btn-refuse"
        @mouseenter="handleRefuseEnter"
        @mouseleave="handleRefuseLeave"
        @click.stop.prevent
        v-if="!isAgreed"
        ref="refuseBtnRef"
        :style="{
          left: refuseX + 'px',
          top: refuseY + 'px',
          position: 'fixed',
        }"
      >
        拒绝
      </button>
    </div>

    <!-- 提示语 -->
    <div class="tip" v-if="showTip">太棒啦！😜</div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();

// 响应式数据
const mouthStatus = ref("normal");
const isAgreed = ref(false);
const showTip = ref(false);
const refuseX = ref(160);
const refuseY = ref(100); // 初始位置调整为更居中
const avatarRef = ref(null);
const buttonsRef = ref(null);
const refuseBtnRef = ref(null); // 拒绝按钮ref
const pupilTransform = ref("translate(-50%, -50%)");
const isShow = ref(true);
const isShowLine = ref(false)

// 计算属性：表情class
const mouthClass = computed(() => {
  return {
    "mouth-normal": mouthStatus.value === "normal",
    "mouth-happy": mouthStatus.value === "happy",
    "mouth-sad": mouthStatus.value === "sad",
  };
});

// 眼珠跟随鼠标
const handleMouseMove = (e) => {
  if (!avatarRef.value) return;
  const avatarRect = avatarRef.value.getBoundingClientRect();
  const avatarCenterX = avatarRect.left + avatarRect.width / 2;
  const avatarCenterY = avatarRect.top + avatarRect.height / 2;
  const mouseX = e.clientX;
  const mouseY = e.clientY;

  const maxOffset = 10;
  const dx = mouseX - avatarCenterX;
  const dy = mouseY - avatarCenterY;
  const distance = Math.sqrt(dx * dx + dy * dy);
  const ratio = distance === 0 ? 0 : Math.min(maxOffset / distance, 1);

  const offsetX = dx * ratio;
  const offsetY = dy * ratio;
  pupilTransform.value = `translate(-50%, -50%) translate(${offsetX}px, ${offsetY}px)`;
};

// 同意按钮交互
const handleAgreeEnter = () => {
  mouthStatus.value = "happy";
  isShow.value = false
  isShowLine.value = true;
};
const handleAgreeLeave = (e) => {
  if (!e.relatedTarget || !e.relatedTarget.classList.contains("btn-refuse")) {
    mouthStatus.value = "normal";
    isShow.value = true;
    isShowLine.value = false;
  }
};
const handleAgreeClick = () => {
  isAgreed.value = true;
  showTip.value = true;
  mouthStatus.value = "happy";

  setTimeout(() => {
    router.push("/flowers");
  }, 2000)
};

// 拒绝按钮交互
const handleRefuseEnter = () => {
  mouthStatus.value = "sad";
  moveRefuseBtn();
};
const handleRefuseLeave = (e) => {
  if (!e.relatedTarget || !e.relatedTarget.classList.contains("btn-agree")) {
    mouthStatus.value = "normal";
  }
};

// 核心修复：随机移动拒绝按钮的函数
const moveRefuseBtn = () => {
  if (!refuseBtnRef.value || !buttonsRef.value) return;
  const refuseBtn = refuseBtnRef.value;
  const agreeBtn = buttonsRef.value.querySelector(".btn-agree");

  // 1. 获取拒绝按钮的实际宽高（包含padding、border）
  const btnRect = refuseBtn.getBoundingClientRect();
  const btnWidth = btnRect.width;
  const btnHeight = btnRect.height;

  // 2. 获取窗口可视区域的宽高（排除滚动条，仅可视区域）
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  // 3. 定义最小边距（避免按钮贴边，也防止超出屏幕）
  const minMargin = 20;

  // 4. 计算可随机的最大坐标（减去按钮宽高和最小边距，确保按钮整体在可视区域）
  const maxX = viewportWidth - btnWidth - minMargin;
  const maxY = viewportHeight - btnHeight - minMargin;
  const minX = minMargin;
  const minY = minMargin;

  // 5. 随机生成坐标（确保在min和max之间）
  let randomX = Math.floor(Math.random() * (maxX - minX + 1)) + minX;
  let randomY = Math.floor(Math.random() * (maxY - minY + 1)) + minY;

  // 6. 避免和同意按钮重叠（优化重叠判断逻辑）
  const agreeRect = agreeBtn.getBoundingClientRect();
  const isOverlap = (x, y) => {
    // 检测两个按钮的矩形是否重叠
    return (
      x < agreeRect.right + 10 && // 加10px间距，避免贴太近
      x + btnWidth > agreeRect.left - 10 &&
      y < agreeRect.bottom + 10 &&
      y + btnHeight > agreeRect.top - 10
    );
  };

  // 7. 如果重叠，重新生成坐标（最多尝试20次，防止死循环）
  let attempts = 0;
  while (isOverlap(randomX, randomY) && attempts < 20) {
    randomX = Math.floor(Math.random() * (maxX - minX + 1)) + minX;
    randomY = Math.floor(Math.random() * (maxY - minY + 1)) + minY;
    attempts++;
  }

  // 8. 最终兜底：如果多次尝试仍重叠，强制设置为非重叠位置（避免极端情况）
  if (isOverlap(randomX, randomY)) {
    // 比如把拒绝按钮放在同意按钮的右侧或下侧
    randomX = agreeRect.right + btnWidth + minMargin;
    randomY = agreeRect.top;
    // 如果右侧超出，就放在左侧
    if (randomX + btnWidth > maxX) {
      randomX = agreeRect.left - btnWidth - minMargin;
    }
    // 如果左侧也超出，就放在下方
    if (randomX < minX) {
      randomX = agreeRect.left;
      randomY = agreeRect.bottom + btnHeight + minMargin;
    }
  }

  // 更新拒绝按钮位置
  refuseX.value = randomX;
  refuseY.value = randomY;
};

// 挂载和卸载监听
onMounted(() => {
  document.addEventListener("mousemove", handleMouseMove);
});
onUnmounted(() => {
  document.removeEventListener("mousemove", handleMouseMove);
});
</script>

<style lang="scss" scoped>
/* 样式部分和之前一致，无需修改 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  user-select: none;
}

.container {
  font-family: "Arial", sans-serif;
  background-color: #000;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  gap: 60px;
}

.avatar {
  width: 220px;
  height: 220px;
  background-color: #ffd700;
  border-radius: 50%;
  position: relative;
  box-shadow: 0 0 25px rgba(0, 0, 0, 0.15);
}

.eyes {
  position: absolute;
  top: 70px;
  width: 100%;
  display: flex;
  justify-content: space-around;
  padding: 0 45px;
}

.eye {
  width: 40px;
  height: 40px;
  background-color: #ffffff;
  border-radius: 50%;
  position: relative;
  overflow: hidden;
  padding: 5px;
}

.linebox{
  height: 100%;
  display: flex;
  justify-content: space-around;
}

.line{
  height: 100%;
  border-left: 1px solid #000;
}

.pupil {
  width: 20px;
  height: 20px;
  background-color: #000;
  border-radius: 50%;
  position: absolute;
  top: 50%;
  left: 50%;
  transition: transform 0.05s ease;
}

.mouth {
  position: absolute;
  bottom: 38px;
  left: 50%;
  transform: translateX(-50%);
  transition: all 0.3s ease;
  overflow: hidden;
}

.mouth-normal {
  width: 90px;
  height: 40px;
  background-color: #f76464;
  border-radius: 20px 20px 15px 15px;
}

.ya {
  position: absolute;
  left: 10px;
  width: 20px;
  height: 15px;
  top: 0px;
  background: #fff;
  border-radius: 2px 2px 6px 6px;
}

.nei {
  position: absolute;
  right: 10px;
  width: 20px;
  height: 15px;
  bottom: 0px;
  background: #fff;
  border-radius: 6px 6px 2px 2px;
}

.mouth-happy {
  width: 90px;
  background: #fff;
  height: 40px;
  border: 1px solid rgb(23, 23, 23);
  border-radius: 0 0 40px 40px;
  overflow: hidden;
}

.mouth-sad {
  width: 90px;
  height: 40px;
  border: 3px solid #000;
  border-bottom: none;
  border-radius: 40px 40px 0 0;
  background-color: transparent;
  transform: translateX(-50%) translateY(10px);
}

.buttons {
  display: flex;
  gap: 30px;
  position: relative;
  width: 320px;
  height: 70px;
}

.btn {
  padding: 10px 20px;
  font-size: 18px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.btn-agree {
  padding: 20px 40px !important;
  background-color: #4caf50;
  color: white;
  position: relative;
  z-index: 1;
}

.btn-agree:hover:not(:disabled) {
  background-color: #45a049;
  transform: translateY(-3px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
}

.btn-refuse {
  background-color: #f44336;
  color: white;
  z-index: 1;
}

.tip {
  margin-top: 10px;
  font-size: 18px;
  color: #fff;
  animation: fadeIn 0.5s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 480px) {
  .avatar {
    width: 180px;
    height: 180px;
  }
  .btn {
    padding: 12px 24px;
    font-size: 16px;
  }
}
</style>
