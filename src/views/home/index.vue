<template>
  <div
    style="width: 100vw; height: 100vh; overflow: hidden;"
  >
    <iframe
      ref="iframeRef"
      style="width: 100%; height: 100%"
      src="/static/stepTwo/index.html"
      frameborder="0"
    ></iframe>
  </div>
  <div @click="gotoNextPage" class="mask"></div>
</template>

<script setup>
import { onMounted, onUnmounted, ref } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();

function gotoNextPage() {
  console.log("gotoNextPage");
  router.push({ path: "/agree" });
  // router.push({path: '/test'})
}

// 1. 定义ref获取iframe元素
const iframeRef = ref(null);

// 2. 防抖函数：减少resize事件触发频率
function debounce(fn, delay = 200) {
  let timer = null;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => {
      fn.apply(this, args);
    }, delay);
  };
}

// 3. 窗口大小变化的处理逻辑
function handleResize() {
  // 获取当前窗口的宽高（也可以根据需求自定义逻辑）
  const windowWidth = window.innerWidth;
  const windowHeight = window.innerHeight;

  // 如果需要手动设置iframe尺寸（默认style已设100%，可根据需求调整）
  if (iframeRef.value) {
    // 示例：根据窗口大小动态调整iframe的样式（可自定义逻辑）
    iframeRef.value.style.width = `${windowWidth}px`;
    iframeRef.value.style.height = `${windowHeight}px`;

    // 若iframe内部页面也需要响应式，可通过postMessage传递尺寸信息给子页面
    iframeRef.value.contentWindow.postMessage(
      { width: windowWidth, height: windowHeight },
      "*" // 生产环境建议替换为具体的域名，提升安全性
    );
  }
}

// 4. 防抖后的处理函数
const debouncedHandleResize = debounce(handleResize);

onMounted(() => {
  // 初始化时执行一次，确保尺寸正确
  handleResize();
  // 添加窗口resize事件监听
  window.addEventListener("resize", debouncedHandleResize);
});

onUnmounted(() => {
  // 组件销毁时移除监听，避免内存泄漏
  window.removeEventListener("resize", debouncedHandleResize);
});
</script>

<style  scoped>
  .mask{
    position: fixed;
    left: 0;
    z-index: 999999;
    top: 0;
    width: 100%;
    height: 100%;
    background: transparent;
  }
</style>
