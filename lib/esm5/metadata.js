import { isDirectlySerializableNativeType, isTypeTypedArray, logError, nameof } from './helpers';
export var METADATA_FIELD_KEY = '__typedJsonJsonObjectMetadataInformation__';
var JsonObjectMetadata = (function () {
    function JsonObjectMetadata(classType) {
        this.dataMembers = new Map();
        this.knownTypes = new Set();
        this.knownTypesDeferred = [];
        this.isExplicitlyMarked = false;
        this.isHandledWithoutAnnotation = false;
        this.classType = classType;
    }
    JsonObjectMetadata.getJsonObjectName = function (ctor) {
        var metadata = JsonObjectMetadata.getFromConstructor(ctor);
        return metadata === undefined ? nameof(ctor) : nameof(metadata.classType);
    };
    JsonObjectMetadata.getFromConstructor = function (ctor) {
        var prototype = ctor.prototype;
        if (prototype == null) {
            return;
        }
        var metadata;
        if (Object.prototype.hasOwnProperty.call(prototype, METADATA_FIELD_KEY)) {
            metadata = prototype[METADATA_FIELD_KEY];
        }
        if ((metadata === null || metadata === void 0 ? void 0 : metadata.isExplicitlyMarked) === true) {
            return metadata;
        }
        if (JsonObjectMetadata.doesHandleWithoutAnnotation(ctor)) {
            var primitiveMeta = new JsonObjectMetadata(ctor);
            primitiveMeta.isExplicitlyMarked = true;
            return primitiveMeta;
        }
    };
    JsonObjectMetadata.ensurePresentInPrototype = function (prototype) {
        if (Object.prototype.hasOwnProperty.call(prototype, METADATA_FIELD_KEY)) {
            return prototype[METADATA_FIELD_KEY];
        }
        var objectMetadata = new JsonObjectMetadata(prototype.constructor);
        var parentMetadata = prototype[METADATA_FIELD_KEY];
        if (parentMetadata !== undefined) {
            parentMetadata.dataMembers.forEach(function (memberMetadata, propKey) {
                objectMetadata.dataMembers.set(propKey, memberMetadata);
            });
            parentMetadata.knownTypes.forEach(function (knownType) {
                objectMetadata.knownTypes.add(knownType);
            });
            objectMetadata.typeResolver = parentMetadata.typeResolver;
            objectMetadata.typeHintEmitter = parentMetadata.typeHintEmitter;
        }
        Object.defineProperty(prototype, METADATA_FIELD_KEY, {
            enumerable: false,
            configurable: false,
            writable: false,
            value: objectMetadata,
        });
        return objectMetadata;
    };
    JsonObjectMetadata.getKnownTypeNameFromType = function (constructor) {
        var metadata = JsonObjectMetadata.getFromConstructor(constructor);
        return metadata === undefined ? nameof(constructor) : nameof(metadata.classType);
    };
    JsonObjectMetadata.doesHandleWithoutAnnotation = function (ctor) {
        return isDirectlySerializableNativeType(ctor) || isTypeTypedArray(ctor)
            || ctor === DataView || ctor === ArrayBuffer;
    };
    JsonObjectMetadata.prototype.processDeferredKnownTypes = function () {
        var _this = this;
        this.knownTypesDeferred.forEach(function (typeThunk) {
            typeThunk().getTypes().forEach(function (ctor) { return _this.knownTypes.add(ctor); });
        });
        this.knownTypesDeferred = [];
    };
    return JsonObjectMetadata;
}());
export { JsonObjectMetadata };
export function injectMetadataInformation(prototype, propKey, metadata) {
    var decoratorName = "@jsonMember on ".concat(nameof(prototype.constructor), ".").concat(String(propKey));
    if (typeof prototype === 'function') {
        logError("".concat(decoratorName, ": cannot use a static property."));
        return;
    }
    if (typeof prototype[propKey] === 'function') {
        logError("".concat(decoratorName, ": cannot use a method property."));
        return;
    }
    if (metadata == null
        || (metadata.type === undefined && metadata.deserializer === undefined)) {
        logError("".concat(decoratorName, ": JsonMemberMetadata has unknown type."));
        return;
    }
    var objectMetadata = JsonObjectMetadata.ensurePresentInPrototype(prototype);
    if (metadata.deserializer === undefined) {
        objectMetadata.knownTypesDeferred.push(metadata.type);
    }
    Object.keys(metadata)
        .forEach(function (key) { return (metadata[key] === undefined) && delete metadata[key]; });
    objectMetadata.dataMembers.set(metadata.name, metadata);
}
//# sourceMappingURL=metadata.js.map