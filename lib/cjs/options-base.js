"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractOptionBase = extractOptionBase;
exports.getDefaultOptionOf = getDefaultOptionOf;
exports.getOptionValue = getOptionValue;
exports.mergeOptions = mergeOptions;
var kAllOptions = [
    'preserveNull',
];
function extractOptionBase(from) {
    var options = Object.keys(from)
        .filter(function (key) { return kAllOptions.indexOf(key) > -1; })
        .reduce(function (obj, key) {
        obj[key] = from[key];
        return obj;
    }, {});
    return Object.keys(options).length > 0 ? options : undefined;
}
function getDefaultOptionOf(key) {
    switch (key) {
        case 'preserveNull':
            return false;
    }
    return null;
}
function getOptionValue(key, options) {
    if (options != null && options[key] != null) {
        return options[key];
    }
    return getDefaultOptionOf(key);
}
function mergeOptions(existing, moreSpecific) {
    return moreSpecific == null
        ? existing
        : __assign(__assign({}, existing), moreSpecific);
}
//# sourceMappingURL=options-base.js.map