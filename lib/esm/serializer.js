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
export class Serializer {
    constructor() {
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
    setSerializationStrategy(type, serializer) {
        this.serializationStrategy.set(type, serializer);
    }
    setTypeHintEmitter(typeEmitterCallback) {
        if (typeof typeEmitterCallback !== 'function') {
            throw new TypeError('\'typeEmitterCallback\' is not a function.');
        }
        this.typeHintEmitter = typeEmitterCallback;
    }
    getTypeHintEmitter() {
        return this.typeHintEmitter;
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
    retrievePreserveNull(memberOptions) {
        return getOptionValue('preserveNull', mergeOptions(this.options, memberOptions));
    }
    convertSingleValue(sourceObject, typeDescriptor, memberName = 'object', memberOptions) {
        if (this.retrievePreserveNull(memberOptions) && sourceObject === null) {
            return null;
        }
        if (!isValueDefined(sourceObject)) {
            return;
        }
        if (!isInstanceOf(sourceObject, typeDescriptor.ctor)) {
            const expectedName = nameof(typeDescriptor.ctor);
            const actualName = nameof(sourceObject.constructor);
            this.errorHandler(new TypeError(`Could not serialize '${memberName}': expected '${expectedName}',`
                + ` got '${actualName}'.`));
            return;
        }
        const serializer = this.serializationStrategy.get(typeDescriptor.ctor);
        if (serializer !== undefined) {
            return serializer(sourceObject, typeDescriptor, memberName, this, memberOptions);
        }
        if (typeof sourceObject === 'object') {
            return convertAsObject(sourceObject, typeDescriptor, this);
        }
        let error = `Could not serialize '${memberName}'; don't know how to serialize type`;
        if (typeDescriptor.hasFriendlyName()) {
            error += ` '${typeDescriptor.ctor.name}'`;
        }
        this.errorHandler(new TypeError(`${error}.`));
    }
}
function convertAsObject(sourceObject, typeDescriptor, serializer) {
    let sourceTypeMetadata;
    let targetObject;
    let typeHintEmitter = serializer.getTypeHintEmitter();
    if (sourceObject.constructor !== typeDescriptor.ctor
        && sourceObject instanceof typeDescriptor.ctor) {
        sourceTypeMetadata = JsonObjectMetadata.getFromConstructor(sourceObject.constructor);
    }
    else {
        sourceTypeMetadata = JsonObjectMetadata.getFromConstructor(typeDescriptor.ctor);
    }
    if (sourceTypeMetadata === undefined) {
        targetObject = Object.assign({}, sourceObject);
    }
    else {
        const beforeSerializationMethodName = sourceTypeMetadata.beforeSerializationMethodName;
        if (beforeSerializationMethodName != null) {
            if (typeof sourceObject[beforeSerializationMethodName] === 'function') {
                sourceObject[beforeSerializationMethodName]();
            }
            else if (typeof sourceObject.constructor[beforeSerializationMethodName]
                === 'function') {
                sourceObject.constructor[beforeSerializationMethodName]();
            }
            else {
                serializer.getErrorHandler()(new TypeError(`beforeSerialization callback '`
                    + `${nameof(sourceTypeMetadata.classType)}.${beforeSerializationMethodName}`
                    + `' is not a method.`));
            }
        }
        const sourceMeta = sourceTypeMetadata;
        targetObject = {};
        const classOptions = mergeOptions(serializer.options, sourceMeta.options);
        if (sourceMeta.typeHintEmitter != null) {
            typeHintEmitter = sourceMeta.typeHintEmitter;
        }
        sourceMeta.dataMembers.forEach((objMemberMetadata) => {
            const objMemberOptions = mergeOptions(classOptions, objMemberMetadata.options);
            let serialized;
            if (objMemberMetadata.serializer != null) {
                serialized = objMemberMetadata.serializer(sourceObject[objMemberMetadata.key], {
                    fallback: (so, td) => serializer.convertSingleValue(so, ensureTypeDescriptor(td)),
                });
            }
            else if (objMemberMetadata.type == null) {
                throw new TypeError(`Could not serialize ${objMemberMetadata.name}, there is`
                    + ` no constructor nor serialization function to use.`);
            }
            else {
                serialized = serializer.convertSingleValue(sourceObject[objMemberMetadata.key], objMemberMetadata.type(), `${nameof(sourceMeta.classType)}.${objMemberMetadata.key}`, objMemberOptions);
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
        throw new TypeError(`Could not serialize ${memberName} as Array: incorrect TypeDescriptor detected, please`
            + ' use proper annotation or function for this type');
    }
    if (typeDescriptor.elementType == null) {
        throw new TypeError(`Could not serialize ${memberName} as Array: missing element type definition.`);
    }
    sourceObject.forEach((element, i) => {
        if (!(serializer.retrievePreserveNull(memberOptions) && element === null)
            && !isInstanceOf(element, typeDescriptor.elementType.ctor)) {
            const expectedTypeName = nameof(typeDescriptor.elementType.ctor);
            const actualTypeName = element && nameof(element.constructor);
            throw new TypeError(`Could not serialize ${memberName}[${i}]:`
                + ` expected '${expectedTypeName}', got '${actualTypeName}'.`);
        }
    });
    return sourceObject.map((element, i) => {
        return serializer.convertSingleValue(element, typeDescriptor.elementType, `${memberName}[${i}]`, memberOptions);
    });
}
function convertAsSet(sourceObject, typeDescriptor, memberName, serializer, memberOptions) {
    if (!(typeDescriptor instanceof SetTypeDescriptor)) {
        throw new TypeError(`Could not serialize ${memberName} as Set: incorrect TypeDescriptor detected, please`
            + ' use proper annotation or function for this type');
    }
    if (typeDescriptor.elementType == null) {
        throw new TypeError(`Could not serialize ${memberName} as Set: missing element type definition.`);
    }
    memberName += '[]';
    const resultArray = [];
    sourceObject.forEach((element) => {
        const resultElement = serializer.convertSingleValue(element, typeDescriptor.elementType, memberName, memberOptions);
        if (!isValueDefined(element) || isValueDefined(resultElement)) {
            resultArray.push(resultElement);
        }
    });
    return resultArray;
}
function convertAsMap(sourceObject, typeDescriptor, memberName, serializer, memberOptions) {
    if (!(typeDescriptor instanceof MapTypeDescriptor)) {
        throw new TypeError(`Could not serialize ${memberName} as Map: incorrect TypeDescriptor detected. ` +
            `Please use a proper annotation or function for this type.`);
    }
    if (!typeDescriptor.valueType) {
        throw new TypeError(`Could not serialize ${memberName} as Map: missing value type definition.`);
    }
    if (!typeDescriptor.keyType) {
        throw new TypeError(`Could not serialize ${memberName} as Map: missing key type definition.`);
    }
    const keyMemberName = `${memberName}[].key`;
    const valueMemberName = `${memberName}[].value`;
    const resultShape = typeDescriptor.getCompleteOptions().shape;
    const result = resultShape === 1 ? {} : [];
    const preserveNull = serializer.retrievePreserveNull(memberOptions);
    sourceObject.forEach((value, key) => {
        const convertedKey = serializer.convertSingleValue(key, typeDescriptor.keyType, keyMemberName, memberOptions);
        const convertedValue = serializer.convertSingleValue(value, typeDescriptor.valueType, valueMemberName, memberOptions);
        const keyDefined = isValueDefined(convertedKey);
        const valueDefined = convertedValue === null ? preserveNull : isValueDefined(convertedValue);
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
        .map(charCode => String.fromCharCode(charCode)).join('');
}
function convertAsDataView(dataView) {
    return convertAsArrayBuffer(dataView.buffer);
}
//# sourceMappingURL=serializer.js.map