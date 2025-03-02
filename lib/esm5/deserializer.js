import { identity, isSubtypeOf, isValueDefined, logError, nameof } from './helpers';
import { JsonObjectMetadata } from './metadata';
import { getOptionValue, mergeOptions } from './options-base';
import { AnyT, ArrayTypeDescriptor, ConcreteTypeDescriptor, ensureTypeDescriptor, MapTypeDescriptor, SetTypeDescriptor, } from './type-descriptor';
export function defaultTypeResolver(sourceObject, knownTypes) {
    if (sourceObject.__type != null) {
        return knownTypes.get(sourceObject.__type);
    }
}
var Deserializer = (function () {
    function Deserializer() {
        this.typeResolver = defaultTypeResolver;
        this.errorHandler = logError;
        this.deserializationStrategy = new Map([
            [AnyT.ctor, identity],
            [Number, deserializeDirectly],
            [String, deserializeDirectly],
            [Boolean, deserializeDirectly],
            [Date, deserializeDate],
            [ArrayBuffer, stringToArrayBuffer],
            [DataView, stringToDataView],
            [Array, convertAsArray],
            [Set, convertAsSet],
            [Map, convertAsMap],
            [Float32Array, convertAsFloatArray],
            [Float64Array, convertAsFloatArray],
            [Uint8Array, convertAsUintArray],
            [Uint8ClampedArray, convertAsUintArray],
            [Uint16Array, convertAsUintArray],
            [Uint32Array, convertAsUintArray],
        ]);
    }
    Deserializer.prototype.setDeserializationStrategy = function (type, deserializer) {
        this.deserializationStrategy.set(type, deserializer);
    };
    Deserializer.prototype.setNameResolver = function (nameResolverCallback) {
        this.nameResolver = nameResolverCallback;
    };
    Deserializer.prototype.setTypeResolver = function (typeResolverCallback) {
        if (typeof typeResolverCallback !== 'function') {
            throw new TypeError('\'typeResolverCallback\' is not a function.');
        }
        this.typeResolver = typeResolverCallback;
    };
    Deserializer.prototype.getTypeResolver = function () {
        return this.typeResolver;
    };
    Deserializer.prototype.setErrorHandler = function (errorHandlerCallback) {
        if (typeof errorHandlerCallback !== 'function') {
            throw new TypeError('\'errorHandlerCallback\' is not a function.');
        }
        this.errorHandler = errorHandlerCallback;
    };
    Deserializer.prototype.getErrorHandler = function () {
        return this.errorHandler;
    };
    Deserializer.prototype.convertSingleValue = function (sourceObject, typeDescriptor, knownTypes, memberName, memberOptions) {
        if (memberName === void 0) { memberName = 'object'; }
        if (this.retrievePreserveNull(memberOptions) && sourceObject === null) {
            return null;
        }
        else if (!isValueDefined(sourceObject)) {
            return;
        }
        var deserializer = this.deserializationStrategy.get(typeDescriptor.ctor);
        if (deserializer !== undefined) {
            return deserializer(sourceObject, typeDescriptor, knownTypes, memberName, this, memberOptions);
        }
        if (typeof sourceObject === 'object') {
            return convertAsObject(sourceObject, typeDescriptor, knownTypes, memberName, this);
        }
        var error = "Could not deserialize '".concat(memberName, "'; don't know how to deserialize type");
        if (typeDescriptor.hasFriendlyName()) {
            error += " '".concat(typeDescriptor.ctor.name, "'");
        }
        this.errorHandler(new TypeError("".concat(error, ".")));
    };
    Deserializer.prototype.instantiateType = function (ctor) {
        return new ctor();
    };
    Deserializer.prototype.mergeKnownTypes = function () {
        var _this = this;
        var knownTypeMaps = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            knownTypeMaps[_i] = arguments[_i];
        }
        var result = new Map();
        knownTypeMaps.forEach(function (knownTypes) {
            knownTypes.forEach(function (ctor, name) {
                if (_this.nameResolver === undefined) {
                    result.set(name, ctor);
                }
                else {
                    result.set(_this.nameResolver(ctor), ctor);
                }
            });
        });
        return result;
    };
    Deserializer.prototype.createKnownTypesMap = function (knowTypes) {
        var _this = this;
        var map = new Map();
        knowTypes.forEach(function (ctor) {
            if (_this.nameResolver === undefined) {
                var knownTypeMeta = JsonObjectMetadata.getFromConstructor(ctor);
                var customName = (knownTypeMeta === null || knownTypeMeta === void 0 ? void 0 : knownTypeMeta.isExplicitlyMarked) === true
                    ? knownTypeMeta.name
                    : null;
                map.set(customName !== null && customName !== void 0 ? customName : ctor.name, ctor);
            }
            else {
                map.set(_this.nameResolver(ctor), ctor);
            }
        });
        return map;
    };
    Deserializer.prototype.retrievePreserveNull = function (memberOptions) {
        return getOptionValue('preserveNull', mergeOptions(this.options, memberOptions));
    };
    return Deserializer;
}());
export { Deserializer };
function throwTypeMismatchError(targetType, expectedSourceType, actualSourceType, memberName) {
    throw new TypeError("Could not deserialize ".concat(memberName, " as ").concat(targetType, ":")
        + " expected ".concat(expectedSourceType, ", got ").concat(actualSourceType, "."));
}
function makeTypeErrorMessage(expectedType, actualType, memberName) {
    var expectedTypeName = typeof expectedType === 'function'
        ? nameof(expectedType)
        : expectedType;
    var actualTypeName = typeof actualType === 'function' ? nameof(actualType) : actualType;
    return "Could not deserialize ".concat(memberName, ": expected '").concat(expectedTypeName, "',")
        + " got '".concat(actualTypeName, "'.");
}
function srcTypeNameForDebug(sourceObject) {
    return sourceObject == null ? 'undefined' : nameof(sourceObject.constructor);
}
function deserializeDirectly(sourceObject, typeDescriptor, knownTypes, objectName) {
    if (sourceObject.constructor !== typeDescriptor.ctor) {
        throw new TypeError(makeTypeErrorMessage(nameof(typeDescriptor.ctor), sourceObject.constructor, objectName));
    }
    return sourceObject;
}
function convertAsObject(sourceObject, typeDescriptor, knownTypes, memberName, deserializer) {
    if (typeof sourceObject !== 'object' || sourceObject === null) {
        deserializer.getErrorHandler()(new TypeError("Cannot deserialize ".concat(memberName, ": 'sourceObject' must be a defined object.")));
        return undefined;
    }
    var expectedSelfType = typeDescriptor.ctor;
    var sourceObjectMetadata = JsonObjectMetadata.getFromConstructor(expectedSelfType);
    var knownTypeConstructors = knownTypes;
    var typeResolver = deserializer.getTypeResolver();
    if (sourceObjectMetadata !== undefined) {
        sourceObjectMetadata.processDeferredKnownTypes();
        knownTypeConstructors = deserializer.mergeKnownTypes(knownTypeConstructors, deserializer.createKnownTypesMap(sourceObjectMetadata.knownTypes));
        if (sourceObjectMetadata.typeResolver != null) {
            typeResolver = sourceObjectMetadata.typeResolver;
        }
    }
    var typeFromTypeHint = typeResolver(sourceObject, knownTypeConstructors);
    if (typeFromTypeHint != null) {
        if (isSubtypeOf(typeFromTypeHint, expectedSelfType)) {
            expectedSelfType = typeFromTypeHint;
            sourceObjectMetadata = JsonObjectMetadata.getFromConstructor(typeFromTypeHint);
            if (sourceObjectMetadata !== undefined) {
                knownTypeConstructors = deserializer.mergeKnownTypes(knownTypeConstructors, deserializer.createKnownTypesMap(sourceObjectMetadata.knownTypes));
            }
        }
    }
    if ((sourceObjectMetadata === null || sourceObjectMetadata === void 0 ? void 0 : sourceObjectMetadata.isExplicitlyMarked) === true) {
        var sourceMetadata_1 = sourceObjectMetadata;
        var sourceObjectWithDeserializedProperties_1 = {};
        var classOptions_1 = mergeOptions(deserializer.options, sourceMetadata_1.options);
        sourceMetadata_1.dataMembers.forEach(function (objMemberMetadata, propKey) {
            var objMemberValue = sourceObject[propKey];
            var objMemberDebugName = "".concat(nameof(sourceMetadata_1.classType), ".").concat(propKey);
            var objMemberOptions = mergeOptions(classOptions_1, objMemberMetadata.options);
            var revivedValue;
            if (objMemberMetadata.deserializer != null) {
                revivedValue = objMemberMetadata.deserializer(objMemberValue, {
                    fallback: function (so, td) { return deserializer.convertSingleValue(so, ensureTypeDescriptor(td), knownTypes); },
                });
            }
            else if (objMemberMetadata.type == null) {
                throw new TypeError("Cannot deserialize ".concat(objMemberDebugName, " there is")
                    + " no constructor nor deserialization function to use.");
            }
            else {
                revivedValue = deserializer.convertSingleValue(objMemberValue, objMemberMetadata.type(), knownTypeConstructors, objMemberDebugName, objMemberOptions);
            }
            if (isValueDefined(revivedValue)
                || (deserializer.retrievePreserveNull(objMemberOptions)
                    && revivedValue === null)) {
                sourceObjectWithDeserializedProperties_1[objMemberMetadata.key] = revivedValue;
            }
            else if (objMemberMetadata.isRequired === true) {
                deserializer.getErrorHandler()(new TypeError("Missing required member '".concat(objMemberDebugName, "'.")));
            }
        });
        var targetObject = void 0;
        if (typeof (sourceObjectMetadata === null || sourceObjectMetadata === void 0 ? void 0 : sourceObjectMetadata.initializerCallback) === 'function') {
            try {
                targetObject = sourceObjectMetadata === null || sourceObjectMetadata === void 0 ? void 0 : sourceObjectMetadata.initializerCallback(sourceObjectWithDeserializedProperties_1, sourceObject);
                if (targetObject == null) {
                    throw new TypeError("Cannot deserialize ".concat(memberName, ":")
                        + " 'initializer' function returned undefined/null"
                        + ", but '".concat(nameof(sourceObjectMetadata === null || sourceObjectMetadata === void 0 ? void 0 : sourceObjectMetadata.classType), "' was expected."));
                }
                else if (!(targetObject instanceof (sourceObjectMetadata === null || sourceObjectMetadata === void 0 ? void 0 : sourceObjectMetadata.classType))) {
                    throw new TypeError("Cannot deserialize ".concat(memberName, ":")
                        + "'initializer' returned '".concat(nameof(targetObject.constructor), "'")
                        + ", but '".concat(nameof(sourceObjectMetadata === null || sourceObjectMetadata === void 0 ? void 0 : sourceObjectMetadata.classType), "' was expected")
                        + ", and '".concat(nameof(targetObject.constructor), "' is not a subtype of")
                        + " '".concat(nameof(sourceObjectMetadata === null || sourceObjectMetadata === void 0 ? void 0 : sourceObjectMetadata.classType), "'"));
                }
            }
            catch (e) {
                deserializer.getErrorHandler()(e);
                return undefined;
            }
        }
        else {
            targetObject = deserializer.instantiateType(expectedSelfType);
        }
        Object.assign(targetObject, sourceObjectWithDeserializedProperties_1);
        var methodName = sourceObjectMetadata === null || sourceObjectMetadata === void 0 ? void 0 : sourceObjectMetadata.onDeserializedMethodName;
        if (methodName != null) {
            if (typeof targetObject[methodName] === 'function') {
                targetObject[methodName]();
            }
            else if (typeof targetObject.constructor[methodName] === 'function') {
                targetObject.constructor[methodName]();
            }
            else {
                deserializer.getErrorHandler()(new TypeError("onDeserialized callback"
                    + "'".concat(nameof(sourceObjectMetadata === null || sourceObjectMetadata === void 0 ? void 0 : sourceObjectMetadata.classType), ".").concat(methodName, "' is not a method.")));
            }
        }
        return targetObject;
    }
    else {
        var targetObject_1 = {};
        Object.keys(sourceObject).forEach(function (sourceKey) {
            targetObject_1[sourceKey] = deserializer.convertSingleValue(sourceObject[sourceKey], new ConcreteTypeDescriptor(sourceObject[sourceKey].constructor), knownTypes, sourceKey);
        });
        return targetObject_1;
    }
}
function convertAsArray(sourceObject, typeDescriptor, knownTypes, memberName, deserializer, memberOptions) {
    if (!(typeDescriptor instanceof ArrayTypeDescriptor)) {
        throw new TypeError("Could not deserialize ".concat(memberName, " as Array: incorrect TypeDescriptor detected,")
            + ' please use proper annotation or function for this type');
    }
    if (!Array.isArray(sourceObject)) {
        deserializer.getErrorHandler()(new TypeError(makeTypeErrorMessage(Array, sourceObject.constructor, memberName)));
        return [];
    }
    if (typeDescriptor.elementType == null) {
        deserializer.getErrorHandler()(new TypeError("Could not deserialize ".concat(memberName, " as Array: missing constructor reference of")
            + " Array elements."));
        return [];
    }
    return sourceObject.map(function (element, i) {
        try {
            return deserializer.convertSingleValue(element, typeDescriptor.elementType, knownTypes, "".concat(memberName, "[").concat(i, "]"), memberOptions);
        }
        catch (e) {
            deserializer.getErrorHandler()(e);
            return undefined;
        }
    });
}
function convertAsSet(sourceObject, typeDescriptor, knownTypes, memberName, deserializer, memberOptions) {
    if (!(typeDescriptor instanceof SetTypeDescriptor)) {
        throw new TypeError("Could not deserialize ".concat(memberName, " as Set: incorrect TypeDescriptor detected,")
            + " please use proper annotation or function for this type");
    }
    if (!Array.isArray(sourceObject)) {
        deserializer.getErrorHandler()(new TypeError(makeTypeErrorMessage(Array, sourceObject.constructor, memberName)));
        return new Set();
    }
    if (typeDescriptor.elementType == null) {
        deserializer.getErrorHandler()(new TypeError("Could not deserialize ".concat(memberName, " as Set: missing constructor reference of")
            + " Set elements."));
        return new Set();
    }
    var resultSet = new Set();
    sourceObject.forEach(function (element, i) {
        try {
            resultSet.add(deserializer.convertSingleValue(element, typeDescriptor.elementType, knownTypes, "".concat(memberName, "[").concat(i, "]"), memberOptions));
        }
        catch (e) {
            deserializer.getErrorHandler()(e);
        }
    });
    return resultSet;
}
function isExpectedMapShape(source, expectedShape) {
    return (expectedShape === 0 && Array.isArray(source))
        || (expectedShape === 1 && typeof source === 'object');
}
function convertAsMap(sourceObject, typeDescriptor, knownTypes, memberName, deserializer, memberOptions) {
    if (!(typeDescriptor instanceof MapTypeDescriptor)) {
        throw new TypeError("Could not deserialize ".concat(memberName, " as Map: incorrect TypeDescriptor detected,")
            + 'please use proper annotation or function for this type');
    }
    var expectedShape = typeDescriptor.getCompleteOptions().shape;
    if (!isExpectedMapShape(sourceObject, expectedShape)) {
        var expectedType = expectedShape === 0 ? Array : Object;
        deserializer.getErrorHandler()(new TypeError(makeTypeErrorMessage(expectedType, sourceObject.constructor, memberName)));
        return new Map();
    }
    if (typeDescriptor.keyType == null) {
        deserializer.getErrorHandler()(new TypeError("Could not deserialize ".concat(memberName, " as Map: missing key constructor.")));
        return new Map();
    }
    if (typeDescriptor.valueType == null) {
        deserializer.getErrorHandler()(new TypeError("Could not deserialize ".concat(memberName, " as Map: missing value constructor.")));
        return new Map();
    }
    var keyMemberName = "".concat(memberName, "[].key");
    var valueMemberName = "".concat(memberName, "[].value");
    var resultMap = new Map();
    if (expectedShape === 1) {
        Object.keys(sourceObject).forEach(function (key) {
            try {
                var resultKey = deserializer.convertSingleValue(key, typeDescriptor.keyType, knownTypes, keyMemberName, memberOptions);
                if (isValueDefined(resultKey)) {
                    resultMap.set(resultKey, deserializer.convertSingleValue(sourceObject[key], typeDescriptor.valueType, knownTypes, valueMemberName, memberOptions));
                }
            }
            catch (e) {
                deserializer.getErrorHandler()(e);
            }
        });
    }
    else {
        sourceObject.forEach(function (element) {
            try {
                var key = deserializer.convertSingleValue(element.key, typeDescriptor.keyType, knownTypes, keyMemberName, memberOptions);
                if (isValueDefined(key)) {
                    resultMap.set(key, deserializer.convertSingleValue(element.value, typeDescriptor.valueType, knownTypes, valueMemberName, memberOptions));
                }
            }
            catch (e) {
                deserializer.getErrorHandler()(e);
            }
        });
    }
    return resultMap;
}
function deserializeDate(sourceObject, typeDescriptor, knownTypes, memberName) {
    if (typeof sourceObject === 'number') {
        var isInteger = sourceObject % 1 === 0;
        if (!isInteger) {
            throw new TypeError("Could not deserialize ".concat(memberName, " as Date:")
                + " expected an integer, got a number with decimal places.");
        }
        return new Date(sourceObject);
    }
    else if (typeof sourceObject === 'string') {
        return new Date(sourceObject);
    }
    else {
        return sourceObject;
    }
}
function stringToArrayBuffer(sourceObject, typeDescriptor, knownTypes, memberName) {
    if (typeof sourceObject !== 'string') {
        throwTypeMismatchError('ArrayBuffer', 'a string source', srcTypeNameForDebug(sourceObject), memberName);
    }
    return createArrayBufferFromString(sourceObject);
}
function stringToDataView(sourceObject, typeDescriptor, knownTypes, memberName) {
    if (typeof sourceObject !== 'string') {
        throwTypeMismatchError('DataView', 'a string source', srcTypeNameForDebug(sourceObject), memberName);
    }
    return new DataView(createArrayBufferFromString(sourceObject));
}
function createArrayBufferFromString(input) {
    var buf = new ArrayBuffer(input.length * 2);
    var bufView = new Uint16Array(buf);
    for (var i = 0, strLen = input.length; i < strLen; i++) {
        bufView[i] = input.charCodeAt(i);
    }
    return buf;
}
function convertAsFloatArray(sourceObject, typeDescriptor, knownTypes, memberName) {
    var constructor = typeDescriptor.ctor;
    if (Array.isArray(sourceObject) && sourceObject.every(function (elem) { return !isNaN(elem); })) {
        return new constructor(sourceObject);
    }
    return throwTypeMismatchError(constructor.name, 'a numeric source array', srcTypeNameForDebug(sourceObject), memberName);
}
function convertAsUintArray(sourceObject, typeDescriptor, knownTypes, memberName) {
    var constructor = typeDescriptor.ctor;
    if (Array.isArray(sourceObject) && sourceObject.every(function (elem) { return !isNaN(elem); })) {
        return new constructor(sourceObject.map(function (value) { return ~~value; }));
    }
    return throwTypeMismatchError(typeDescriptor.ctor.name, 'a numeric source array', srcTypeNameForDebug(sourceObject), memberName);
}
//# sourceMappingURL=deserializer.js.map