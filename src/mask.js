export default class Mask {

    constructor(pattern, opt) {
        this.options = opt || {};
        this.options = {
            reverse: this.options.reverse || false,
            usedefaults: this.options.usedefaults || this.options.reverse
        };
        this.pattern = pattern;
    }

    process(value, pattern, options) {
        return new Mask(pattern, options).process(value);
    };

    apply(value, pattern, options) {
        return new Mask(pattern, options).apply(value);
    };

    validate(value, pattern, options) {
        return new Mask(pattern, options).validate(value);
    };

}

Mask.prototype.process = function proccess(value) {
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
            if (this.options.reverse && _isEscaped(pattern2, patternPos)) {
                formatted = _concatChar(formatted, pc, this.options, token);
                patternPos = patternPos + steps.inc;
                continue;
            } else if (!this.options.reverse && escapeNext) {
                formatted = _concatChar(formatted, pc, this.options, token);
                escapeNext = false;
                continue;
            } else if (!this.options.reverse && token && token.escape) {
                escapeNext = true;
                continue;
            }
        }

        if (!inRecursiveMode && token && token.recursive) {
            recursive.push(pc);
        } else if (inRecursiveMode && !vc) {
            formatted = _concatChar(formatted, pc, this.options, token);
            continue;
        } else if (!inRecursiveMode && recursive.length > 0 && !vc) {
            continue;
        }

        if (!token) {
            formatted = _concatChar(formatted, pc, this.options, token);
            if (!inRecursiveMode && recursive.length) {
                recursive.push(pc);
            }
        } else if (token.optional) {
            if (token.pattern.test(vc) && optionalNumbersToUse) {
                formatted = _concatChar(formatted, vc, this.options, token);
                valuePos = valuePos + steps.inc;
                optionalNumbersToUse--;
            } else if (recursive.length > 0 && vc) {
                valid = false;
                break;
            }
        } else if (token.pattern.test(vc)) {
            formatted = _concatChar(formatted, vc, this.options, token);
            valuePos = valuePos + steps.inc;
        } else if (!vc && token._default && this.options.usedefaults) {
            formatted = _concatChar(formatted, token._default, this.options, token);
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

const tokens = {
    '0': {pattern: /\d/, _default: '0'},
    '9': {pattern: /\d/, optional: true},
    '#': {pattern: /\d/, optional: true, recursive: true},
    'A': {pattern: /[a-zA-Z0-9]/},
    'S': {pattern: /[a-zA-Z]/},
    'U': {pattern: /[a-zA-Z]/, transform: function(c) { return c.toLocaleUpperCase(); }},
    'L': {pattern: /[a-zA-Z]/, transform: function(c) { return c.toLocaleLowerCase(); }},
    '$': {escape: true}
}

const _isEscaped = (pattern, pos) => {
    let cont = 0;
    let i = pos - 1;
    let token = {escape: true};
    while (i >= 0 && token && token.escape) {
        token = tokens[pattern.charAt(i)];
        cont += token && token.escape ? 1 : 0;
        i--;
    }
    return cont > 0 && cont % 2 === 1;
}

const _calcOptionalNumbersToUse = (pattern, value) => {
    let numbersInP = pattern.replace(/[^0]/g,'').length;
    let numbersInV = value.replace(/[^\d]/g,'').length;
    return numbersInV - numbersInP;
}

const _concatChar = (text, character, options, token) => {
    if (token && typeof token.transform === 'function') {
        character = token.transform(character);
    }
    if (options.reverse) {
        return character + text;
    }
    return text + character;
}

const _hasMoreTokens = (pattern, pos, inc) => {
    let pc = pattern.charAt(pos);
    let token = tokens[pc];
    if (pc === '') {
        return false;
    }
    return token && !token.escape ? true : _hasMoreTokens(pattern, pos + inc, inc);
}

const _hasMoreRecursiveTokens = (pattern, pos, inc) => {
    let pc = pattern.charAt(pos);
    let token = tokens[pc];
    if (pc === '') {
        return false;
    }
    return token && token.recursive ? true : _hasMoreRecursiveTokens(pattern, pos + inc, inc);
}

const _insertChar = (text, char, position) => {
    let t = text.split('');
    t.splice(position, 0, char);
    return t.join('');
}