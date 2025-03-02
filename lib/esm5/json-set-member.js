import { isReflectMetadataSupported, logError, MISSING_REFLECT_CONF_MSG, nameof } from './helpers';
import { injectMetadataInformation, } from './metadata';
import { extractOptionBase } from './options-base';
import { ensureTypeThunk, SetT } from './type-descriptor';
export function jsonSetMember(maybeTypeThunk, options) {
    if (options === void 0) { options = {}; }
    return function (target, propKey) {
        var _a;
        var decoratorName = "@jsonSetMember on ".concat(nameof(target.constructor), ".").concat(String(propKey));
        var typeThunk = ensureTypeThunk(maybeTypeThunk, decoratorName);
        var reflectedType = isReflectMetadataSupported
            ? Reflect.getMetadata('design:type', target, propKey)
            : null;
        if (reflectedType != null && reflectedType !== Set && reflectedType !== Object) {
            logError("".concat(decoratorName, ": property is not a Set. ").concat(MISSING_REFLECT_CONF_MSG));
            return;
        }
        injectMetadataInformation(target, propKey, {
            type: function () { return SetT(typeThunk()); },
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
//# sourceMappingURL=json-set-member.js.map