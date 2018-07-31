import maskFactory from "../mask-factory";

const config = {
    br: {thousand: '.', decimal: ','},
    us: {thousand: ',', decimal: '.'}
};

export default maskFactory((el, {value, arg, modifiers}) => {
    const key = arg || Object.keys(modifiers)[0] || 'br';
    const conf = config[key];
    
    let pattern = `#${conf.thousand}##0`;
    
    if (value && value > 0) {
        pattern += conf.decimal;
        while (value > 0) {
            pattern += '0';
            value--;
        }
    }
    
    return {
        pattern,
        options: {reverse: true},
        clearValue: 'number',
        format({value, formatter}) {
            return formatter.apply(Number(value));
        }
    }
});