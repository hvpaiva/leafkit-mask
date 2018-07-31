/**
  * Leafkit - Ferramentas Vue para UI
  * 
  * leafkit-mask v0.5.0
  * @license MIT
  * (c) 2018 hvpaiva
  */
'use strict';

var Mask = function Mask(pattern, opt) {
    this.options = opt || {};
    this.options = {
        reverse: this.options.reverse || false,
        usedefaults: this.options.usedefaults || this.options.reverse
    };
    this.pattern = pattern;
};

Mask.prototype.process = function process (value, pattern, options) {
    return new Mask(pattern, options).process(value);
};

Mask.prototype.apply = function apply (value, pattern, options) {
    return new Mask(pattern, options).apply(value);
};

Mask.prototype.validate = function validate (value, pattern, options) {
    return new Mask(pattern, options).validate(value);
};

Mask.prototype.process = function proccess(value) {
    var this$1 = this;

    if (!value) {
        return {result: '', valid: false};
    }
    value = value + '';
    var pattern2 = this.pattern;
    var valid = true;
    var formatted = '';
    var valuePos = this.options.reverse ? value.length - 1 : 0;
    var patternPos = 0;
    var optionalNumbersToUse = _calcOptionalNumbersToUse(pattern2, value);
    var escapeNext = false;
    var recursive = [];
    var inRecursiveMode = false;

    var steps = {
        start: this.options.reverse ? pattern2.length - 1 : 0,
        end: this.options.reverse ? -1 : pattern2.length,
        inc: this.options.reverse ? -1 : 1
    };

    function continueCondition(options) {
        if (!inRecursiveMode && !recursive.length && _hasMoreTokens(pattern2, patternPos, steps.inc)) {
            return true;
        } else if (!inRecursiveMode && recursive.length &&
            _hasMoreRecursiveTokens(pattern2, patternPos, steps.inc)) {
            return true;
        } else if (!inRecursiveMode) {
            inRecursiveMode = recursive.length > 0;
        }

        if (inRecursiveMode) {
            var pc = recursive.shift();
            recursive.push(pc);
            if (options.reverse && valuePos >= 0) {
                patternPos++;
                pattern2 = _insertChar(pattern2, pc, patternPos);
                return true;
            } else if (!options.reverse && valuePos < value.length) {
                pattern2 = _insertChar(pattern2, pc, patternPos);
                return true;
            }
        }
        return patternPos < pattern2.length && patternPos >= 0;
    }

    for (patternPos = steps.start; continueCondition(this.options); patternPos = patternPos + steps.inc) {
        var vc = value.charAt(valuePos);
        var pc = pattern2.charAt(patternPos);

        var token = tokens[pc];
        if (recursive.length && token && !token.recursive) {
            token = null;
        }

        if (!inRecursiveMode || vc) {
            if (this$1.options.reverse && _isEscaped(pattern2, patternPos)) {
                formatted = _concatChar(formatted, pc, this$1.options, token);
                patternPos = patternPos + steps.inc;
                continue;
            } else if (!this$1.options.reverse && escapeNext) {
                formatted = _concatChar(formatted, pc, this$1.options, token);
                escapeNext = false;
                continue;
            } else if (!this$1.options.reverse && token && token.escape) {
                escapeNext = true;
                continue;
            }
        }

        if (!inRecursiveMode && token && token.recursive) {
            recursive.push(pc);
        } else if (inRecursiveMode && !vc) {
            formatted = _concatChar(formatted, pc, this$1.options, token);
            continue;
        } else if (!inRecursiveMode && recursive.length > 0 && !vc) {
            continue;
        }

        if (!token) {
            formatted = _concatChar(formatted, pc, this$1.options, token);
            if (!inRecursiveMode && recursive.length) {
                recursive.push(pc);
            }
        } else if (token.optional) {
            if (token.pattern.test(vc) && optionalNumbersToUse) {
                formatted = _concatChar(formatted, vc, this$1.options, token);
                valuePos = valuePos + steps.inc;
                optionalNumbersToUse--;
            } else if (recursive.length > 0 && vc) {
                valid = false;
                break;
            }
        } else if (token.pattern.test(vc)) {
            formatted = _concatChar(formatted, vc, this$1.options, token);
            valuePos = valuePos + steps.inc;
        } else if (!vc && token._default && this$1.options.usedefaults) {
            formatted = _concatChar(formatted, token._default, this$1.options, token);
        } else {
            valid = false;
            break;
        }
    }

    return {result: formatted, valid: valid};
};

Mask.prototype.apply = function(value) {
    return this.process(value).result;
};

Mask.prototype.validate = function(value) {
    return this.process(value).valid;
};

var tokens = {
    '0': {pattern: /\d/, _default: '0'},
    '9': {pattern: /\d/, optional: true},
    '#': {pattern: /\d/, optional: true, recursive: true},
    'A': {pattern: /[a-zA-Z0-9]/},
    'S': {pattern: /[a-zA-Z]/},
    'U': {pattern: /[a-zA-Z]/, transform: function(c) { return c.toLocaleUpperCase(); }},
    'L': {pattern: /[a-zA-Z]/, transform: function(c) { return c.toLocaleLowerCase(); }},
    '$': {escape: true}
};

var _isEscaped = function (pattern, pos) {
    var cont = 0;
    var i = pos - 1;
    var token = {escape: true};
    while (i >= 0 && token && token.escape) {
        token = tokens[pattern.charAt(i)];
        cont += token && token.escape ? 1 : 0;
        i--;
    }
    return cont > 0 && cont % 2 === 1;
};

var _calcOptionalNumbersToUse = function (pattern, value) {
    var numbersInP = pattern.replace(/[^0]/g,'').length;
    var numbersInV = value.replace(/[^\d]/g,'').length;
    return numbersInV - numbersInP;
};

var _concatChar = function (text, character, options, token) {
    if (token && typeof token.transform === 'function') {
        character = token.transform(character);
    }
    if (options.reverse) {
        return character + text;
    }
    return text + character;
};

var _hasMoreTokens = function (pattern, pos, inc) {
    var pc = pattern.charAt(pos);
    var token = tokens[pc];
    if (pc === '') {
        return false;
    }
    return token && !token.escape ? true : _hasMoreTokens(pattern, pos + inc, inc);
};

var _hasMoreRecursiveTokens = function (pattern, pos, inc) {
    var pc = pattern.charAt(pos);
    var token = tokens[pc];
    if (pc === '') {
        return false;
    }
    return token && token.recursive ? true : _hasMoreRecursiveTokens(pattern, pos + inc, inc);
};

var _insertChar = function (text, char, position) {
    var t = text.split('');
    t.splice(position, 0, char);
    return t.join('');
};

var getInputElement = function (el, vnode) {
    return vnode.tag === 'input' ? el : el.querySelector('input:not([readonly])');
};

var filterNumbers = function (v) { return v.replace(/\D/g, ''); };

var filterLetters = function (v) { return v.replace(/[^a-zA-Z]/g, ''); };

var filterAlphanumeric = function (v) { return v.replace(/[^a-zA-Z0-9]/g, ''); };

var getCleaner = function (clearValue) {
    if (typeof clearValue === 'function') {
        return clearValue;
    }
    
    switch (clearValue) {
        case 'number':
        return filterNumbers;
        break;
        case 'letter':
        return filterLetters;
        break;
        default:
        return filterAlphanumeric;
    }
};

var createHandler = function (ref) {
	var clean = ref.clean;
	var format = ref.format;
	var formatter = ref.formatter;

	return function (ref) {
		var target = ref.target;
		var type = ref.type;
		var isTrusted = ref.isTrusted;

		
		if (type === 'paste') {
			target.value = '';
		}
		
		var value = clean(target.value);
		target.value = format({value: value, formatter: formatter});
		target.dataset.value = target.value;
		
		if (type === 'mask' || isTrusted) {
			target.dispatchEvent(new Event('input'));
		}
	}
};

var defaultFormat = function (ref) {
	var value = ref.value;
	var formatter = ref.formatter;

	value = formatter.apply(value);
	return value.trim().replace(/[^0-9]$/, '');
};

var maskFactory = function (bind) {
	return {
		
		bind: function bind$1(el, binding, vnode) {
			var mask = bind(el, binding, vnode);
			
			var clean = getCleaner(mask.clearValue);
			var format = mask.format || defaultFormat;
			var formatter = mask.pattern ? new Mask(mask.pattern, mask.options || {}) : null;
			var handler = createHandler({clean: clean, format: format, formatter: formatter});
			
			el = getInputElement(el, vnode);
			
			el.addEventListener('input', handler, false);
			el.addEventListener('paste', handler, false);
			el.addEventListener('blur', handler, false);
			el.addEventListener('mask', handler, false);
			
			handler({target: el, type: 'mask'});
		},
		
		update: function update (el, ref, vnode) {
			el = getInputElement(el, vnode);
			_Vue.nextTick(function () {
				var previousValue = el.dataset.value || '';
				if (previousValue !== el.value) {
					el.dispatchEvent(new Event('mask'));
				}
			});
		}
	}
};

var config = {
    br: {thousand: '.', decimal: ','},
    us: {thousand: ',', decimal: '.'}
};

var decimal = maskFactory(function (el, ref) {
    var value = ref.value;
    var arg = ref.arg;
    var modifiers = ref.modifiers;

    var key = arg || Object.keys(modifiers)[0] || 'br';
    var conf = config[key];
    
    var pattern = "#" + (conf.thousand) + "##0";
    
    if (value && value > 0) {
        pattern += conf.decimal;
        while (value > 0) {
            pattern += '0';
            value--;
        }
    }
    
    return {
        pattern: pattern,
        options: {reverse: true},
        clearValue: 'number',
        format: function format(ref) {
            var value = ref.value;
            var formatter = ref.formatter;

            return formatter.apply(Number(value));
        }
    }
});

var number = maskFactory(function () {
  return {
    pattern: '#0',
    options: {reverse: true},
    clearValue: 'number'
  }
});

var _Vue;

function install(Vue) {
    if (install.installed) {
        return;
    }
    
    _Vue = Vue;
    
    Vue.directive('maskDecimal', decimal);
    Vue.directive('maskNumber', number);
    
    install.installed = true;
}

var index = {install: install};

if (typeof window !== 'undefined' && window.Vue) {
  window.Vue.use({install: install});
}

module.exports = index;
