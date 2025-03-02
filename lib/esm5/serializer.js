import { __assign } from "tslib";
import { identity, isInstanceOf, isValueDefined, logError, nameof, } from './helpers';
import { JsonObjectMetadata } from './metadata';
import { getOptionValue, mergeOptions } from './options-base';
import { AnyT, ArrayTypeDescriptor, ensureTypeDescriptor, MapTypeDescriptor, SetTypeDescriptor, } from './type-descriptor';
export function defaultTypeEmitter(targetObject, sourceObject, expectedSourceType, sourceTypeMetadata) {
    var _a;
    if (sourceObject.constructor !== expectedSourceType) {
        targetObject.__type = (_a = sourceTypeMetadata === null || sourceTypeMetadata === void 0 ? void 0 : sourceTypeMetadata.name) !== null && _a !== void 0 ? _a : nameof(sourceObject.constructor);
    }
}
var Serializer = (function () {
    function Serializer() {
        this.typeHintEmitter = defaultTypeEmitter;
        this.errorHandler = logError;
        this.serializationStrategy = new Map([
            [AnyT.ctor, identity],
            [Date, identity],
            [Number, identity],
            [String, identity],
            [Boolean, identity],
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
        return getOptionValue('preserveNull', mergeOptions(this.options, memberOptions));
    };
    Serializer.prototype.convertSingleValue = function (sourceObject, typeDescriptor, memberName, memberOptions) {
        if (memberName === void 0) { memberName = 'object'; }
        if (this.retrievePreserveNull(memberOptions) && sourceObject === null) {
            return null;
        }
        if (!isValueDefined(sourceObject)) {
            return;
        }
        if (!isInstanceOf(sourceObject, typeDescriptor.ctor)) {
            var expectedName = nameof(typeDescriptor.ctor);
            var actualName = nameof(sourceObject.constructor);
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
export { Serializer };
function convertAsObject(sourceObject, typeDescriptor, serializer) {
    var sourceTypeMetadata;
    var targetObject;
    var typeHintEmitter = serializer.getTypeHintEmitter();
    if (sourceObject.constructor !== typeDescriptor.ctor
        && sourceObject instanceof typeDescriptor.ctor) {
        sourceTypeMetadata = JsonObjectMetadata.getFromConstructor(sourceObject.constructor);
    }
    else {
        sourceTypeMetadata = JsonObjectMetadata.getFromConstructor(typeDescriptor.ctor);
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
                    + "".concat(nameof(sourceTypeMetadata.classType), ".").concat(beforeSerializationMethodName)
                    + "' is not a method."));
            }
        }
        var sourceMeta_1 = sourceTypeMetadata;
        targetObject = {};
        var classOptions_1 = mergeOptions(serializer.options, sourceMeta_1.options);
        if (sourceMeta_1.typeHintEmitter != null) {
            typeHintEmitter = sourceMeta_1.typeHintEmitter;
        }
        sourceMeta_1.dataMembers.forEach(function (objMemberMetadata) {
            var objMemberOptions = mergeOptions(classOptions_1, objMemberMetadata.options);
            var serialized;
            if (objMemberMetadata.serializer != null) {
                serialized = objMemberMetadata.serializer(sourceObject[objMemberMetadata.key], {
                    fallback: function (so, td) { return serializer.convertSingleValue(so, ensureTypeDescriptor(td)); },
                });
            }
            else if (objMemberMetadata.type == null) {
                throw new TypeError("Could not serialize ".concat(objMemberMetadata.name, ", there is")
                    + " no constructor nor serialization function to use.");
            }
            else {
                serialized = serializer.convertSingleValue(sourceObject[objMemberMetadata.key], objMemberMetadata.type(), "".concat(nameof(sourceMeta_1.classType), ".").concat(objMemberMetadata.key), objMemberOptions);
            }
            if ((serializer.retrievePreserveNull(objMemberOptions) && serialized === null)
                || isValueDefined(serialized)) {
                targetObject[objMemberMetadata.name] = serialized;
            }
        });
    }
    typeHintEmitter(targetObject, sourceObject, typeDescriptor.ctor, sourceTypeMetadata);
    return targetObject;
}
function convertAsArray(sourceObject, typeDescriptor, memberName, serializer, memberOptions) {
    if (!(typeDescriptor instanceof ArrayTypeDescriptor)) {
        throw new TypeError("Could not serialize ".concat(memberName, " as Array: incorrect TypeDescriptor detected, please")
            + ' use proper annotation or function for this type');
    }
    if (typeDescriptor.elementType == null) {
        throw new TypeError("Could not serialize ".concat(memberName, " as Array: missing element type definition."));
    }
    sourceObject.forEach(function (element, i) {
        if (!(serializer.retrievePreserveNull(memberOptions) && element === null)
            && !isInstanceOf(element, typeDescriptor.elementType.ctor)) {
            var expectedTypeName = nameof(typeDescriptor.elementType.ctor);
            var actualTypeName = element && nameof(element.constructor);
            throw new TypeError("Could not serialize ".concat(memberName, "[").concat(i, "]:")
                + " expected '".concat(expectedTypeName, "', got '").concat(actualTypeName, "'."));
        }
    });
    return sourceObject.map(function (element, i) {
        return serializer.convertSingleValue(element, typeDescriptor.elementType, "".concat(memberName, "[").concat(i, "]"), memberOptions);
    });
}
function convertAsSet(sourceObject, typeDescriptor, memberName, serializer, memberOptions) {
    if (!(typeDescriptor instanceof SetTypeDescriptor)) {
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
        if (!isValueDefined(element) || isValueDefined(resultElement)) {
            resultArray.push(resultElement);
        }
    });
    return resultArray;
}
function convertAsMap(sourceObject, typeDescriptor, memberName, serializer, memberOptions) {
    if (!(typeDescriptor instanceof MapTypeDescriptor)) {
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
        var keyDefined = isValueDefined(convertedKey);
        var valueDefined = convertedValue === null ? preserveNull : isValueDefined(convertedValue);
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