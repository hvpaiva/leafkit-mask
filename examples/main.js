import Vue from 'vue';
import LeafkitMask from 'leafkit-mask';
import App from './App.vue';

Vue.use(LeafkitMask);

new Vue({
    el: '#app',
    render: h => h(App)
});