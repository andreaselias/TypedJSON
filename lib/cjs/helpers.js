"use strict";
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isReflectMetadataSupported = exports.MISSING_REFLECT_CONF_MSG = exports.LAZY_TYPE_EXPLANATION = void 0;
exports.isDirectlySerializableNativeType = isDirectlySerializableNativeType;
exports.isDirectlyDeserializableNativeType = isDirectlyDeserializableNativeType;
exports.isTypeTypedArray = isTypeTypedArray;
exports.isObject = isObject;
exports.shouldOmitParseString = shouldOmitParseString;
exports.parseToJSObject = parseToJSObject;
exports.isSubtypeOf = isSubtypeOf;
exports.logError = logError;
exports.logMessage = logMessage;
exports.logWarning = logWarning;
exports.isValueDefined = isValueDefined;
exports.isInstanceOf = isInstanceOf;
exports.nameof = nameof;
exports.identity = identity;
var type_descriptor_1 = require("./type-descriptor");
exports.LAZY_TYPE_EXPLANATION = "If the type is not yet defined, for example due to circular references, add '() => ' before it. E.g. @jsonMember(() => Foo)";
exports.MISSING_REFLECT_CONF_MSG = 'Make sure that you have both "experimentalDecorators"'
    + ' and "emitDecoratorMetadata" enabled in your tsconfig.json';
function isDirectlySerializableNativeType(type) {
    return [Date, Number, String, Boolean].indexOf(type) !== -1;
}
function isDirectlyDeserializableNativeType(type) {
    return [Number, String, Boolean].indexOf(type) !== -1;
}
function isTypeTypedArray(type) {
    return [
        Float32Array,
        Float64Array,
        Int8Array,
        Uint8Array,
        Uint8ClampedArray,
        Int16Array,
        Uint16Array,
        Int32Array,
        Uint32Array,
    ].indexOf(type) !== -1;
}
function isObject(value) {
    return typeof value === 'object';
}
function shouldOmitParseString(jsonStr, expectedType) {
    var expectsTypesSerializedAsStrings = expectedType === String
        || expectedType === ArrayBuffer
        || expectedType === DataView;
    var hasQuotes = jsonStr.length >= 2
        && jsonStr[0] === '"'
        && jsonStr[jsonStr.length - 1] === '"';
    if (expectedType === Date) {
        var isNumber = !isNaN(Number(jsonStr.trim()));
        return !hasQuotes && !isNumber;
    }
    return expectsTypesSerializedAsStrings && !hasQuotes;
}
function parseToJSObject(json, expectedType) {
    if (typeof json !== 'string' || shouldOmitParseString(json, expectedType)) {
        return json;
    }
    return JSON.parse(json);
}
function isSubtypeOf(A, B) {
    return A === B || A.prototype instanceof B;
}
function logError(message) {
    var optionalParams = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        optionalParams[_i - 1] = arguments[_i];
    }
    if (typeof console === 'object' && typeof console.error === 'function') {
        console.error.apply(console, __spreadArray([message], optionalParams, false));
    }
    else if (typeof console === 'object' && typeof console.log === 'function') {
        console.log.apply(console, __spreadArray(["ERROR: ".concat(message)], optionalParams, false));
    }
}
function logMessage(message) {
    var optionalParams = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        optionalParams[_i - 1] = arguments[_i];
    }
    if (typeof console === 'object' && typeof console.log === 'function') {
        console.log.apply(console, __spreadArray([message], optionalParams, false));
    }
}
function logWarning(message) {
    var optionalParams = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        optionalParams[_i - 1] = arguments[_i];
    }
    if (typeof console === 'object' && typeof console.warn === 'function') {
        console.warn.apply(console, __spreadArray([message], optionalParams, false));
    }
    else if (typeof console === 'object' && typeof console.log === 'function') {
        console.log.apply(console, __spreadArray(["WARNING: ".concat(message)], optionalParams, false));
    }
}
function isValueDefined(value) {
    return !(typeof value === 'undefined' || value === null);
}
function isInstanceOf(value, constructor) {
    if (constructor === type_descriptor_1.AnyT.ctor) {
        return true;
    }
    else if (typeof value === 'number') {
        return constructor === Number;
    }
    else if (typeof value === 'string') {
        return constructor === String;
    }
    else if (typeof value === 'boolean') {
        return constructor === Boolean;
    }
    else if (isObject(value)) {
        return value instanceof constructor;
    }
    return false;
}
exports.isReflectMetadataSupported = typeof Reflect === 'object' && typeof Reflect.getMetadata === 'function';
function nameof(fn) {
    if (typeof fn.name === 'string') {
        return fn.name;
    }
    return 'undefined';
}
function identity(arg) {
    return arg;
}
//# sourceMappingURL=helpers.js.map