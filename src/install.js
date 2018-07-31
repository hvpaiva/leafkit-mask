import decimal from './masks/decimal';
import number from './masks/number';

export let _Vue;

export function install(Vue) {
    if (install.installed) {
        return;
    }
    
    _Vue = Vue;
    
    Vue.directive('maskDecimal', decimal);
    Vue.directive('maskNumber', number);
    
    install.installed = true;
}
