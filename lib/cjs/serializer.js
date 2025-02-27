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
exports.Serializer = void 0;
exports.defaultTypeEmitter = defaultTypeEmitter;
var helpers_1 = require("./helpers");
var metadata_1 = require("./metadata");
var options_base_1 = require("./options-base");
var type_descriptor_1 = require("./type-descriptor");
function defaultTypeEmitter(targetObject, sourceObject, expectedSourceType, sourceTypeMetadata) {
    var _a;
    if (sourceObject.constructor !== expectedSourceType) {
        targetObject.__type = (_a = sourceTypeMetadata === null || sourceTypeMetadata === void 0 ? void 0 : sourceTypeMetadata.name) !== null && _a !== void 0 ? _a : (0, helpers_1.nameof)(sourceObject.constructor);
    }
}
var Serializer = (function () {
    function Serializer() {
        this.typeHintEmitter = defaultTypeEmitter;
        this.errorHandler = helpers_1.logError;
        this.serializationStrategy = new Map([
            [type_descriptor_1.AnyT.ctor, helpers_1.identity],
            [Date, helpers_1.identity],
            [Number, helpers_1.identity],
            [String, helpers_1.identity],
            [Boolean, helpers_1.identity],
            [ArrayBuffer, convertAsArrayBuffer],
            [DataView, convertAsDataView],
            [Array, convertAsArray],
            [Set, convertAsSet],
            [Map, convertAsMap],
            [Float32Array, convertAsTypedArray],
            [Float64Array, convertAsTypedArray],
            [Int8Array, convertAsTypedArray],
            [Uint8Array, convertAsTypedArray],
            [Uint8ClampedArray, convertAsTypedArray],
            [Int16Array, convertAsTypedArray],
            [Uint16Array, convertAsTypedArray],
            [Int32Array, convertAsTypedArray],
            [Uint32Array, convertAsTypedArray],
        ]);
    }
    Serializer.prototype.setSerializationStrategy = function (type, serializer) {
        this.serializationStrategy.set(type, serializer);
    };
    Serializer.prototype.setTypeHintEmitter = function (typeEmitterCallback) {
        if (typeof typeEmitterCallback !== 'function') {
            throw new TypeError('\'typeEmitterCallback\' is not a function.');
        }
        this.typeHintEmitter = typeEmitterCallback;
    };
    Serializer.prototype.getTypeHintEmitter = function () {
        return this.typeHintEmitter;
    };
    Serializer.prototype.setErrorHandler = function (errorHandlerCallback) {
        if (typeof errorHandlerCallback !== 'function') {
            throw new TypeError('\'errorHandlerCallback\' is not a function.');
        }
        this.errorHandler = errorHandlerCallback;
    };
    Serializer.prototype.getErrorHandler = function () {
        return this.errorHandler;
    };
    Serializer.prototype.retrievePreserveNull = function (memberOptions) {
        return (0, options_base_1.getOptionValue)('preserveNull', (0, options_base_1.mergeOptions)(this.options, memberOptions));
    };
    Serializer.prototype.convertSingleValue = function (sourceObject, typeDescriptor, memberName, memberOptions) {
        if (memberName === void 0) { memberName = 'object'; }
        if (this.retrievePreserveNull(memberOptions) && sourceObject === null) {
            return null;
        }
        if (!(0, helpers_1.isValueDefined)(sourceObject)) {
            return;
        }
        if (!(0, helpers_1.isInstanceOf)(sourceObject, typeDescriptor.ctor)) {
            var expectedName = (0, helpers_1.nameof)(typeDescriptor.ctor);
            var actualName = (0, helpers_1.nameof)(sourceObject.constructor);
            this.errorHandler(new TypeError("Could not serialize '".concat(memberName, "': expected '").concat(expectedName, "',")
                + " got '".concat(actualName, "'.")));
            return;
        }
        var serializer = this.serializationStrategy.get(typeDescriptor.ctor);
        if (serializer !== undefined) {
            return serializer(sourceObject, typeDescriptor, memberName, this, memberOptions);
        }
        if (typeof sourceObject === 'object') {
            return convertAsObject(sourceObject, typeDescriptor, this);
        }
        var error = "Could not serialize '".concat(memberName, "'; don't know how to serialize type");
        if (typeDescriptor.hasFriendlyName()) {
            error += " '".concat(typeDescriptor.ctor.name, "'");
        }
        this.errorHandler(new TypeError("".concat(error, ".")));
    };
    return Serializer;
}());
exports.Serializer = Serializer;
function convertAsObject(sourceObject, typeDescriptor, serializer) {
    var sourceTypeMetadata;
    var targetObject;
    var typeHintEmitter = serializer.getTypeHintEmitter();
    if (sourceObject.constructor !== typeDescriptor.ctor
        && sourceObject instanceof typeDescriptor.ctor) {
        sourceTypeMetadata = metadata_1.JsonObjectMetadata.getFromConstructor(sourceObject.constructor);
    }
    else {
        sourceTypeMetadata = metadata_1.JsonObjectMetadata.getFromConstructor(typeDescriptor.ctor);
    }
    if (sourceTypeMetadata === undefined) {
        targetObject = __assign({}, sourceObject);
    }
    else {
        var beforeSerializationMethodName = sourceTypeMetadata.beforeSerializationMethodName;
        if (beforeSerializationMethodName != null) {
            if (typeof sourceObject[beforeSerializationMethodName] === 'function') {
                sourceObject[beforeSerializationMethodName]();
            }
            else if (typeof sourceObject.constructor[beforeSerializationMethodName]
                === 'function') {
                sourceObject.constructor[beforeSerializationMethodName]();
            }
            else {
                serializer.getErrorHandler()(new TypeError("beforeSerialization callback '"
                    + "".concat((0, helpers_1.nameof)(sourceTypeMetadata.classType), ".").concat(beforeSerializationMethodName)
                    + "' is not a method."));
            }
        }
        var sourceMeta_1 = sourceTypeMetadata;
        targetObject = {};
        var classOptions_1 = (0, options_base_1.mergeOptions)(serializer.options, sourceMeta_1.options);
        if (sourceMeta_1.typeHintEmitter != null) {
            typeHintEmitter = sourceMeta_1.typeHintEmitter;
        }
        sourceMeta_1.dataMembers.forEach(function (objMemberMetadata) {
            var objMemberOptions = (0, options_base_1.mergeOptions)(classOptions_1, objMemberMetadata.options);
            var serialized;
            if (objMemberMetadata.serializer != null) {
                serialized = objMemberMetadata.serializer(sourceObject[objMemberMetadata.key], {
                    fallback: function (so, td) { return serializer.convertSingleValue(so, (0, type_descriptor_1.ensureTypeDescriptor)(td)); },
                });
            }
            else if (objMemberMetadata.type == null) {
                throw new TypeError("Could not serialize ".concat(objMemberMetadata.name, ", there is")
                    + " no constructor nor serialization function to use.");
            }
            else {
                serialized = serializer.convertSingleValue(sourceObject[objMemberMetadata.key], objMemberMetadata.type(), "".concat((0, helpers_1.nameof)(sourceMeta_1.classType), ".").concat(objMemberMetadata.key), objMemberOptions);
            }
            if ((serializer.retrievePreserveNull(objMemberOptions) && serialized === null)
                || (0, helpers_1.isValueDefined)(serialized)) {
                targetObject[objMemberMetadata.name] = serialized;
            }
        });
    }
    typeHintEmitter(targetObject, sourceObject, typeDescriptor.ctor, sourceTypeMetadata);
    return targetObject;
}
function convertAsArray(sourceObject, typeDescriptor, memberName, serializer, memberOptions) {
    if (!(typeDescriptor instanceof type_descriptor_1.ArrayTypeDescriptor)) {
        throw new TypeError("Could not serialize ".concat(memberName, " as Array: incorrect TypeDescriptor detected, please")
            + ' use proper annotation or function for this type');
    }
    if (typeDescriptor.elementType == null) {
        throw new TypeError("Could not serialize ".concat(memberName, " as Array: missing element type definition."));
    }
    sourceObject.forEach(function (element, i) {
        if (!(serializer.retrievePreserveNull(memberOptions) && element === null)
            && !(0, helpers_1.isInstanceOf)(element, typeDescriptor.elementType.ctor)) {
            var expectedTypeName = (0, helpers_1.nameof)(typeDescriptor.elementType.ctor);
            var actualTypeName = element && (0, helpers_1.nameof)(element.constructor);
            throw new TypeError("Could not serialize ".concat(memberName, "[").concat(i, "]:")
                + " expected '".concat(expectedTypeName, "', got '").concat(actualTypeName, "'."));
        }
    });
    return sourceObject.map(function (element, i) {
        return serializer.convertSingleValue(element, typeDescriptor.elementType, "".concat(memberName, "[").concat(i, "]"), memberOptions);
    });
}
function convertAsSet(sourceObject, typeDescriptor, memberName, serializer, memberOptions) {
    if (!(typeDescriptor instanceof type_descriptor_1.SetTypeDescriptor)) {
        throw new TypeError("Could not serialize ".concat(memberName, " as Set: incorrect TypeDescriptor detected, please")
            + ' use proper annotation or function for this type');
    }
    if (typeDescriptor.elementType == null) {
        throw new TypeError("Could not serialize ".concat(memberName, " as Set: missing element type definition."));
    }
    memberName += '[]';
    var resultArray = [];
    sourceObject.forEach(function (element) {
        var resultElement = serializer.convertSingleValue(element, typeDescriptor.elementType, memberName, memberOptions);
        if (!(0, helpers_1.isValueDefined)(element) || (0, helpers_1.isValueDefined)(resultElement)) {
            resultArray.push(resultElement);
        }
    });
    return resultArray;
}
function convertAsMap(sourceObject, typeDescriptor, memberName, serializer, memberOptions) {
    if (!(typeDescriptor instanceof type_descriptor_1.MapTypeDescriptor)) {
        throw new TypeError("Could not serialize ".concat(memberName, " as Map: incorrect TypeDescriptor detected. ") +
            "Please use a proper annotation or function for this type.");
    }
    if (!typeDescriptor.valueType) {
        throw new TypeError("Could not serialize ".concat(memberName, " as Map: missing value type definition."));
    }
    if (!typeDescriptor.keyType) {
        throw new TypeError("Could not serialize ".concat(memberName, " as Map: missing key type definition."));
    }
    var keyMemberName = "".concat(memberName, "[].key");
    var valueMemberName = "".concat(memberName, "[].value");
    var resultShape = typeDescriptor.getCompleteOptions().shape;
    var result = resultShape === 1 ? {} : [];
    var preserveNull = serializer.retrievePreserveNull(memberOptions);
    sourceObject.forEach(function (value, key) {
        var convertedKey = serializer.convertSingleValue(key, typeDescriptor.keyType, keyMemberName, memberOptions);
        var convertedValue = serializer.convertSingleValue(value, typeDescriptor.valueType, valueMemberName, memberOptions);
        var keyDefined = (0, helpers_1.isValueDefined)(convertedKey);
        var valueDefined = convertedValue === null ? preserveNull : (0, helpers_1.isValueDefined)(convertedValue);
        if (keyDefined && valueDefined) {
            if (resultShape === 1) {
                result[convertedKey] = convertedValue;
            }
            else {
                result.push({ key: convertedKey, value: convertedValue });
            }
        }
    });
    return result;
}
function convertAsTypedArray(sourceObject) {
    return Array.from(sourceObject);
}
function convertAsArrayBuffer(buffer) {
    return Array.from(new Uint16Array(buffer))
        .map(function (charCode) { return String.fromCharCode(charCode); }).join('');
}
function convertAsDataView(dataView) {
    return convertAsArrayBuffer(dataView.buffer);
}
//# sourceMappingURL=serializer.js.map