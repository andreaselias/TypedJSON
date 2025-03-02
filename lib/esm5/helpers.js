import { __spreadArray } from "tslib";
import { AnyT } from './type-descriptor';
export var LAZY_TYPE_EXPLANATION = "If the type is not yet defined, for example due to circular references, add '() => ' before it. E.g. @jsonMember(() => Foo)";
export var MISSING_REFLECT_CONF_MSG = 'Make sure that you have both "experimentalDecorators"'
    + ' and "emitDecoratorMetadata" enabled in your tsconfig.json';
export function isDirectlySerializableNativeType(type) {
    return [Date, Number, String, Boolean].indexOf(type) !== -1;
}
export function isDirectlyDeserializableNativeType(type) {
    return [Number, String, Boolean].indexOf(type) !== -1;
}
export function isTypeTypedArray(type) {
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
export function isObject(value) {
    return typeof value === 'object';
}
export function shouldOmitParseString(jsonStr, expectedType) {
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
export function parseToJSObject(json, expectedType) {
    if (typeof json !== 'string' || shouldOmitParseString(json, expectedType)) {
        return json;
    }
    return JSON.parse(json);
}
export function isSubtypeOf(A, B) {
    return A === B || A.prototype instanceof B;
}
export function logError(message) {
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
export function logMessage(message) {
    var optionalParams = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        optionalParams[_i - 1] = arguments[_i];
    }
    if (typeof console === 'object' && typeof console.log === 'function') {
        console.log.apply(console, __spreadArray([message], optionalParams, false));
    }
}
export function logWarning(message) {
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
export function isValueDefined(value) {
    return !(typeof value === 'undefined' || value === null);
}
export function isInstanceOf(value, constructor) {
    if (constructor === AnyT.ctor) {
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
export var isReflectMetadataSupported = typeof Reflect === 'object' && typeof Reflect.getMetadata === 'function';
export function nameof(fn) {
    if (typeof fn.name === 'string') {
        return fn.name;
    }
    return 'undefined';
}
export function identity(arg) {
    return arg;
}
//# sourceMappingURL=helpers.js.map