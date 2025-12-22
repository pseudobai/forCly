<template>
  <div class="text-pixel-art">
    <!-- 文字像素画展示区域 -->
    <div class="preview-container">
      <div class="preview-item">
        <h3>原图预览</h3>
        <!-- 静态图片（public目录下的图片，路径直接写） -->
        <img
          ref="originalImgRef"
          :src="imageSrc"
          class="original-image"
          alt="原图"
        />
      </div>
      <div class="preview-item">
        <h3>文字像素画</h3>
        <canvas ref="textCanvasRef" class="text-canvas"></canvas>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, defineProps, watch } from "vue";

// 定义可传入的配置参数（外部组件可直接传递）
const props = defineProps({
  // 静态图片路径（如：/images/test.jpg，对应public/images/test.jpg）
  imageSrc: {
    type: String,
    required: true,
    default: "/static/test.png",
  },
  // 组成像素的文字集
  textSet: {
    type: String,
    default: "曹玲钰",
  },
  // 像素密度（值越小越清晰，性能消耗越高）
  pixelDensity: {
    type: Number,
    default: 10,
    validator: (val) => val >= 2 && val <= 20, // 限制范围
  },
  // 文字大小（px，等宽字体）
  fontSize: {
    type: Number,
    default: 18,
    validator: (val) => val >= 8 && val <= 24, // 限制范围
  },
  // 可选：是否开启高清渲染（解决Canvas模糊问题）
  useHiDpi: {
    type: Boolean,
    default: true,
  },
});

// 模板引用
const originalImgRef = ref(null); // 原图DOM
const textCanvasRef = ref(null); // 文字像素画Canvas

// 核心：生成文字像素画
const generateTextPixelArt = async () => {
  const canvas = textCanvasRef.value;
  const ctx = canvas.getContext("2d");
  const img = originalImgRef.value;

  // 等待图片完全加载（避免图片未加载完成导致绘制失败）
  if (!img.complete) {
    await new Promise((resolve) => {
      img.onload = resolve;
      img.onerror = resolve; // 图片加载失败也resolve，避免卡死
    });
  }

  // 清空Canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 1. 处理像素密度：缩放原图，减少计算量
  const scaledWidth = Math.floor(img.naturalWidth / props.pixelDensity);
  const scaledHeight = Math.floor(img.naturalHeight / props.pixelDensity);

  // 2. 处理高清屏模糊问题（HiDPI适配）
  const dpr = props.useHiDpi ? window.devicePixelRatio || 1 : 1;
  const finalFontSize = props.fontSize;
  // Canvas实际尺寸 = 显示尺寸 * 设备像素比
  canvas.width = scaledWidth * finalFontSize * dpr;
  canvas.height = scaledHeight * finalFontSize * dpr;
  // 缩放Canvas上下文，让绘制内容适配高清屏
  ctx.scale(dpr, dpr);
  // 显示尺寸（CSS）：与绘制的文字矩阵一致
  canvas.style.width = `${scaledWidth * finalFontSize}px`;
  canvas.style.height = `${scaledHeight * finalFontSize}px`;

  // 3. 临时Canvas：用于获取缩放后的像素数据（不渲染到页面）
  const tempCanvas = document.createElement("canvas");
  const tempCtx = tempCanvas.getContext("2d");
  tempCanvas.width = scaledWidth;
  tempCanvas.height = scaledHeight;
  tempCtx.drawImage(img, 0, 0, scaledWidth, scaledHeight);

  // 4. 获取像素数据（RGBA数组）
  const imageData = tempCtx.getImageData(0, 0, scaledWidth, scaledHeight);
  const data = imageData.data;
  const textArr = props.textSet.trim().split("");
  if (textArr.length === 0) {
    console.warn("文字集不能为空，使用默认值");
    textArr.push("0"); // 兜底默认文字
  }

  // 5. 配置文字绘制样式（等宽字体是关键，确保像素对齐）
  ctx.font = `${finalFontSize}px monospace`; // 等宽字体：monospace/Consolas/微软雅黑等
  ctx.textAlign = "left";
  ctx.textBaseline = "top";

  // 6. 遍历像素，绘制文字（优化：将二维循环改为一维循环，提升性能）
  const totalPixels = scaledWidth * scaledHeight;
  for (let i = 0; i < totalPixels; i++) {
    const x = i % scaledWidth;
    const y = Math.floor(i / scaledWidth);
    const index = i * 4; // 每个像素占4个元素：R、G、B、A

    // 获取像素颜色和透明度
    const r = data[index];
    const g = data[index + 1];
    const b = data[index + 2];
    const alpha = data[index + 3] / 255;

    // 跳过透明像素（优化：减少无意义绘制）
    if (alpha < 0.1) continue;

    // 计算灰度值（优化：使用位运算提升计算速度）
    // 灰度公式：gray = 0.299*R + 0.587*G + 0.114*B
    const gray = (r * 299 + g * 587 + b * 114) >> 10; // 等价于除以1024（≈1000），比除法快

    // 根据灰度值选择文字（灰度越高，选文字集后段的文字，增强对比度）
    const textIndex = Math.floor((gray / 255) * (textArr.length - 1));
    const text = textArr[textIndex] || textArr[0];

    // 绘制文字（颜色与原图像素一致）
    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
    ctx.fillText(text, x * finalFontSize, y * finalFontSize);
  }
};

// 页面挂载后自动生成，配置变化时重新生成
onMounted(() => {
  generateTextPixelArt();
});
watch(
  [
    () => props.imageSrc,
    () => props.textSet,
    () => props.pixelDensity,
    () => props.fontSize,
  ],
  () => {
    generateTextPixelArt();
  },
  { immediate: false, deep: true }
);
</script>

<style scoped>
.text-pixel-art {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: Arial, sans-serif;
}

.preview-container {
  display: flex;
  flex-wrap: wrap;
  gap: 30px;
  justify-content: center;
  align-items: flex-start;
}

.preview-item {
  text-align: center;
}

.original-image {
  max-width: 400px;
  max-height: 400px;
  border: 1px solid #eee;
  border-radius: 4px;
}

.text-canvas {
  border: 1px solid #eee;
  border-radius: 4px;
  max-width: 100%;
  height: auto;
}
</style>
