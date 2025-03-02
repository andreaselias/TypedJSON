import { isReflectMetadataSupported, logError, MISSING_REFLECT_CONF_MSG, nameof } from './helpers';
import { injectMetadataInformation, } from './metadata';
import { extractOptionBase } from './options-base';
import { ensureTypeThunk, MapT } from './type-descriptor';
export function jsonMapMember(maybeKeyThunk, maybeValueThunk, options) {
    if (options === void 0) { options = {}; }
    return function (target, propKey) {
        var _a;
        var decoratorName = "@jsonMapMember on ".concat(nameof(target.constructor), ".").concat(String(propKey));
        var keyThunk = ensureTypeThunk(maybeKeyThunk, decoratorName);
        var valueThunk = ensureTypeThunk(maybeValueThunk, decoratorName);
        var reflectedType = isReflectMetadataSupported
            ? Reflect.getMetadata('design:type', target, propKey)
            : null;
        if (reflectedType != null && reflectedType !== Map && reflectedType !== Object) {
            logError("".concat(decoratorName, ": property is not a Map. ").concat(MISSING_REFLECT_CONF_MSG));
            return;
        }
        injectMetadataInformation(target, propKey, {
            type: function () { return MapT(keyThunk(), valueThunk(), { shape: options.shape }); },
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
//# sourceMappingURL=json-map-member.js.map