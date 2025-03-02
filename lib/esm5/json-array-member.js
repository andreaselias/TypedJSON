import { isReflectMetadataSupported, logError, MISSING_REFLECT_CONF_MSG, nameof } from './helpers';
import { injectMetadataInformation, } from './metadata';
import { extractOptionBase } from './options-base';
import { ArrayTypeDescriptor, ensureTypeDescriptor, ensureTypeThunk, } from './type-descriptor';
export function jsonArrayMember(maybeTypeThunk, options) {
    if (options === void 0) { options = {}; }
    return function (target, propKey) {
        var _a;
        var decoratorName = "@jsonArrayMember on ".concat(nameof(target.constructor), ".").concat(String(propKey));
        var typeThunk = ensureTypeThunk(maybeTypeThunk, decoratorName);
        var dimensions = options.dimensions == null ? 1 : options.dimensions;
        if (!isNaN(dimensions) && dimensions < 1) {
            logError("".concat(decoratorName, ": 'dimensions' option must be at least 1."));
            return;
        }
        var reflectedType = isReflectMetadataSupported
            ? Reflect.getMetadata('design:type', target, propKey)
            : null;
        if (reflectedType != null && reflectedType !== Array && reflectedType !== Object) {
            logError("".concat(decoratorName, ": property is not an Array. ").concat(MISSING_REFLECT_CONF_MSG));
            return;
        }
        injectMetadataInformation(target, propKey, {
            type: function () { return createArrayType(ensureTypeDescriptor(typeThunk()), dimensions); },
            emitDefaultValue: options.emitDefaultValue,
            isRequired: options.isRequired,
            options: extractOptionBase(options),
            key: propKey.toString(),
            name: (_a = options.name) !== null && _a !== void 0 ? _a : propKey.toString(),
            deserializer: options.deserializer,
            serializer: options.serializer,
        });
    };
}
export function createArrayType(elementType, dimensions) {
    var type = new ArrayTypeDescriptor(elementType);
    for (var i = 1; i < dimensions; ++i) {
        type = new ArrayTypeDescriptor(type);
    }
    return type;
}
//# sourceMappingURL=json-array-member.js.map