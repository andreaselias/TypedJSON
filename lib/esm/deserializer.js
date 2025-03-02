import { identity, isSubtypeOf, isValueDefined, logError, nameof } from './helpers';
import { JsonObjectMetadata } from './metadata';
import { getOptionValue, mergeOptions } from './options-base';
import { AnyT, ArrayTypeDescriptor, ConcreteTypeDescriptor, ensureTypeDescriptor, MapTypeDescriptor, SetTypeDescriptor, } from './type-descriptor';
export function defaultTypeResolver(sourceObject, knownTypes) {
    if (sourceObject.__type != null) {
        return knownTypes.get(sourceObject.__type);
    }
}
export class Deserializer {
    constructor() {
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
    setDeserializationStrategy(type, deserializer) {
        this.deserializationStrategy.set(type, deserializer);
    }
    setNameResolver(nameResolverCallback) {
        this.nameResolver = nameResolverCallback;
    }
    setTypeResolver(typeResolverCallback) {
        if (typeof typeResolverCallback !== 'function') {
            throw new TypeError('\'typeResolverCallback\' is not a function.');
        }
        this.typeResolver = typeResolverCallback;
    }
    getTypeResolver() {
        return this.typeResolver;
    }
    setErrorHandler(errorHandlerCallback) {
        if (typeof errorHandlerCallback !== 'function') {
            throw new TypeError('\'errorHandlerCallback\' is not a function.');
        }
        this.errorHandler = errorHandlerCallback;
    }
    getErrorHandler() {
        return this.errorHandler;
    }
    convertSingleValue(sourceObject, typeDescriptor, knownTypes, memberName = 'object', memberOptions) {
        if (this.retrievePreserveNull(memberOptions) && sourceObject === null) {
            return null;
        }
        else if (!isValueDefined(sourceObject)) {
            return;
        }
        const deserializer = this.deserializationStrategy.get(typeDescriptor.ctor);
        if (deserializer !== undefined) {
            return deserializer(sourceObject, typeDescriptor, knownTypes, memberName, this, memberOptions);
        }
        if (typeof sourceObject === 'object') {
            return convertAsObject(sourceObject, typeDescriptor, knownTypes, memberName, this);
        }
        let error = `Could not deserialize '${memberName}'; don't know how to deserialize type`;
        if (typeDescriptor.hasFriendlyName()) {
            error += ` '${typeDescriptor.ctor.name}'`;
        }
        this.errorHandler(new TypeError(`${error}.`));
    }
    instantiateType(ctor) {
        return new ctor();
    }
    mergeKnownTypes(...knownTypeMaps) {
        const result = new Map();
        knownTypeMaps.forEach(knownTypes => {
            knownTypes.forEach((ctor, name) => {
                if (this.nameResolver === undefined) {
                    result.set(name, ctor);
                }
                else {
                    result.set(this.nameResolver(ctor), ctor);
                }
            });
        });
        return result;
    }
    createKnownTypesMap(knowTypes) {
        const map = new Map();
        knowTypes.forEach(ctor => {
            if (this.nameResolver === undefined) {
                const knownTypeMeta = JsonObjectMetadata.getFromConstructor(ctor);
                const customName = (knownTypeMeta === null || knownTypeMeta === void 0 ? void 0 : knownTypeMeta.isExplicitlyMarked) === true
                    ? knownTypeMeta.name
                    : null;
                map.set(customName !== null && customName !== void 0 ? customName : ctor.name, ctor);
            }
            else {
                map.set(this.nameResolver(ctor), ctor);
            }
        });
        return map;
    }
    retrievePreserveNull(memberOptions) {
        return getOptionValue('preserveNull', mergeOptions(this.options, memberOptions));
    }
}
function throwTypeMismatchError(targetType, expectedSourceType, actualSourceType, memberName) {
    throw new TypeError(`Could not deserialize ${memberName} as ${targetType}:`
        + ` expected ${expectedSourceType}, got ${actualSourceType}.`);
}
function makeTypeErrorMessage(expectedType, actualType, memberName) {
    const expectedTypeName = typeof expectedType === 'function'
        ? nameof(expectedType)
        : expectedType;
    const actualTypeName = typeof actualType === 'function' ? nameof(actualType) : actualType;
    return `Could not deserialize ${memberName}: expected '${expectedTypeName}',`
        + ` got '${actualTypeName}'.`;
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
        deserializer.getErrorHandler()(new TypeError(`Cannot deserialize ${memberName}: 'sourceObject' must be a defined object.`));
        return undefined;
    }
    let expectedSelfType = typeDescriptor.ctor;
    let sourceObjectMetadata = JsonObjectMetadata.getFromConstructor(expectedSelfType);
    let knownTypeConstructors = knownTypes;
    let typeResolver = deserializer.getTypeResolver();
    if (sourceObjectMetadata !== undefined) {
        sourceObjectMetadata.processDeferredKnownTypes();
        knownTypeConstructors = deserializer.mergeKnownTypes(knownTypeConstructors, deserializer.createKnownTypesMap(sourceObjectMetadata.knownTypes));
        if (sourceObjectMetadata.typeResolver != null) {
            typeResolver = sourceObjectMetadata.typeResolver;
        }
    }
    const typeFromTypeHint = typeResolver(sourceObject, knownTypeConstructors);
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
        const sourceMetadata = sourceObjectMetadata;
        const sourceObjectWithDeserializedProperties = {};
        const classOptions = mergeOptions(deserializer.options, sourceMetadata.options);
        sourceMetadata.dataMembers.forEach((objMemberMetadata, propKey) => {
            const objMemberValue = sourceObject[propKey];
            const objMemberDebugName = `${nameof(sourceMetadata.classType)}.${propKey}`;
            const objMemberOptions = mergeOptions(classOptions, objMemberMetadata.options);
            let revivedValue;
            if (objMemberMetadata.deserializer != null) {
                revivedValue = objMemberMetadata.deserializer(objMemberValue, {
                    fallback: (so, td) => deserializer.convertSingleValue(so, ensureTypeDescriptor(td), knownTypes),
                });
            }
            else if (objMemberMetadata.type == null) {
                throw new TypeError(`Cannot deserialize ${objMemberDebugName} there is`
                    + ` no constructor nor deserialization function to use.`);
            }
            else {
                revivedValue = deserializer.convertSingleValue(objMemberValue, objMemberMetadata.type(), knownTypeConstructors, objMemberDebugName, objMemberOptions);
            }
            if (isValueDefined(revivedValue)
                || (deserializer.retrievePreserveNull(objMemberOptions)
                    && revivedValue === null)) {
                sourceObjectWithDeserializedProperties[objMemberMetadata.key] = revivedValue;
            }
            else if (objMemberMetadata.isRequired === true) {
                deserializer.getErrorHandler()(new TypeError(`Missing required member '${objMemberDebugName}'.`));
            }
        });
        let targetObject;
        if (typeof (sourceObjectMetadata === null || sourceObjectMetadata === void 0 ? void 0 : sourceObjectMetadata.initializerCallback) === 'function') {
            try {
                targetObject = sourceObjectMetadata === null || sourceObjectMetadata === void 0 ? void 0 : sourceObjectMetadata.initializerCallback(sourceObjectWithDeserializedProperties, sourceObject);
                if (targetObject == null) {
                    throw new TypeError(`Cannot deserialize ${memberName}:`
                        + ` 'initializer' function returned undefined/null`
                        + `, but '${nameof(sourceObjectMetadata === null || sourceObjectMetadata === void 0 ? void 0 : sourceObjectMetadata.classType)}' was expected.`);
                }
                else if (!(targetObject instanceof (sourceObjectMetadata === null || sourceObjectMetadata === void 0 ? void 0 : sourceObjectMetadata.classType))) {
                    throw new TypeError(`Cannot deserialize ${memberName}:`
                        + `'initializer' returned '${nameof(targetObject.constructor)}'`
                        + `, but '${nameof(sourceObjectMetadata === null || sourceObjectMetadata === void 0 ? void 0 : sourceObjectMetadata.classType)}' was expected`
                        + `, and '${nameof(targetObject.constructor)}' is not a subtype of`
                        + ` '${nameof(sourceObjectMetadata === null || sourceObjectMetadata === void 0 ? void 0 : sourceObjectMetadata.classType)}'`);
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
        Object.assign(targetObject, sourceObjectWithDeserializedProperties);
        const methodName = sourceObjectMetadata === null || sourceObjectMetadata === void 0 ? void 0 : sourceObjectMetadata.onDeserializedMethodName;
        if (methodName != null) {
            if (typeof targetObject[methodName] === 'function') {
                targetObject[methodName]();
            }
            else if (typeof targetObject.constructor[methodName] === 'function') {
                targetObject.constructor[methodName]();
            }
            else {
                deserializer.getErrorHandler()(new TypeError(`onDeserialized callback`
                    + `'${nameof(sourceObjectMetadata === null || sourceObjectMetadata === void 0 ? void 0 : sourceObjectMetadata.classType)}.${methodName}' is not a method.`));
            }
        }
        return targetObject;
    }
    else {
        const targetObject = {};
        Object.keys(sourceObject).forEach(sourceKey => {
            targetObject[sourceKey] = deserializer.convertSingleValue(sourceObject[sourceKey], new ConcreteTypeDescriptor(sourceObject[sourceKey].constructor), knownTypes, sourceKey);
        });
        return targetObject;
    }
}
function convertAsArray(sourceObject, typeDescriptor, knownTypes, memberName, deserializer, memberOptions) {
    if (!(typeDescriptor instanceof ArrayTypeDescriptor)) {
        throw new TypeError(`Could not deserialize ${memberName} as Array: incorrect TypeDescriptor detected,`
            + ' please use proper annotation or function for this type');
    }
    if (!Array.isArray(sourceObject)) {
        deserializer.getErrorHandler()(new TypeError(makeTypeErrorMessage(Array, sourceObject.constructor, memberName)));
        return [];
    }
    if (typeDescriptor.elementType == null) {
        deserializer.getErrorHandler()(new TypeError(`Could not deserialize ${memberName} as Array: missing constructor reference of`
            + ` Array elements.`));
        return [];
    }
    return sourceObject.map((element, i) => {
        try {
            return deserializer.convertSingleValue(element, typeDescriptor.elementType, knownTypes, `${memberName}[${i}]`, memberOptions);
        }
        catch (e) {
            deserializer.getErrorHandler()(e);
            return undefined;
        }
    });
}
function convertAsSet(sourceObject, typeDescriptor, knownTypes, memberName, deserializer, memberOptions) {
    if (!(typeDescriptor instanceof SetTypeDescriptor)) {
        throw new TypeError(`Could not deserialize ${memberName} as Set: incorrect TypeDescriptor detected,`
            + ` please use proper annotation or function for this type`);
    }
    if (!Array.isArray(sourceObject)) {
        deserializer.getErrorHandler()(new TypeError(makeTypeErrorMessage(Array, sourceObject.constructor, memberName)));
        return new Set();
    }
    if (typeDescriptor.elementType == null) {
        deserializer.getErrorHandler()(new TypeError(`Could not deserialize ${memberName} as Set: missing constructor reference of`
            + ` Set elements.`));
        return new Set();
    }
    const resultSet = new Set();
    sourceObject.forEach((element, i) => {
        try {
            resultSet.add(deserializer.convertSingleValue(element, typeDescriptor.elementType, knownTypes, `${memberName}[${i}]`, memberOptions));
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
        throw new TypeError(`Could not deserialize ${memberName} as Map: incorrect TypeDescriptor detected,`
            + 'please use proper annotation or function for this type');
    }
    const expectedShape = typeDescriptor.getCompleteOptions().shape;
    if (!isExpectedMapShape(sourceObject, expectedShape)) {
        const expectedType = expectedShape === 0 ? Array : Object;
        deserializer.getErrorHandler()(new TypeError(makeTypeErrorMessage(expectedType, sourceObject.constructor, memberName)));
        return new Map();
    }
    if (typeDescriptor.keyType == null) {
        deserializer.getErrorHandler()(new TypeError(`Could not deserialize ${memberName} as Map: missing key constructor.`));
        return new Map();
    }
    if (typeDescriptor.valueType == null) {
        deserializer.getErrorHandler()(new TypeError(`Could not deserialize ${memberName} as Map: missing value constructor.`));
        return new Map();
    }
    const keyMemberName = `${memberName}[].key`;
    const valueMemberName = `${memberName}[].value`;
    const resultMap = new Map();
    if (expectedShape === 1) {
        Object.keys(sourceObject).forEach(key => {
            try {
                const resultKey = deserializer.convertSingleValue(key, typeDescriptor.keyType, knownTypes, keyMemberName, memberOptions);
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
        sourceObject.forEach((element) => {
            try {
                const key = deserializer.convertSingleValue(element.key, typeDescriptor.keyType, knownTypes, keyMemberName, memberOptions);
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
        const isInteger = sourceObject % 1 === 0;
        if (!isInteger) {
            throw new TypeError(`Could not deserialize ${memberName} as Date:`
                + ` expected an integer, got a number with decimal places.`);
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
    const buf = new ArrayBuffer(input.length * 2);
    const bufView = new Uint16Array(buf);
    for (let i = 0, strLen = input.length; i < strLen; i++) {
        bufView[i] = input.charCodeAt(i);
    }
    return buf;
}
function convertAsFloatArray(sourceObject, typeDescriptor, knownTypes, memberName) {
    const constructor = typeDescriptor.ctor;
    if (Array.isArray(sourceObject) && sourceObject.every(elem => !isNaN(elem))) {
        return new constructor(sourceObject);
    }
    return throwTypeMismatchError(constructor.name, 'a numeric source array', srcTypeNameForDebug(sourceObject), memberName);
}
function convertAsUintArray(sourceObject, typeDescriptor, knownTypes, memberName) {
    const constructor = typeDescriptor.ctor;
    if (Array.isArray(sourceObject) && sourceObject.every(elem => !isNaN(elem))) {
        return new constructor(sourceObject.map(value => ~~value));
    }
    return throwTypeMismatchError(typeDescriptor.ctor.name, 'a numeric source array', srcTypeNameForDebug(sourceObject), memberName);
}
//# sourceMappingURL=deserializer.js.map