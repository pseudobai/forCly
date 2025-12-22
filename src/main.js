import { createApp } from "vue";
import App from "./App.vue";
import router from './router'
import AOS from 'aos';
import 'aos/dist/aos.css'; // 引入 AOS 的 CSS 文件

const app = createApp(App)

app.use(router)
app.use(AOS.init())


app.mount('#app')
