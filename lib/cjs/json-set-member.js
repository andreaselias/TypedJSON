"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.jsonSetMember = jsonSetMember;
var helpers_1 = require("./helpers");
var metadata_1 = require("./metadata");
var options_base_1 = require("./options-base");
var type_descriptor_1 = require("./type-descriptor");
function jsonSetMember(maybeTypeThunk, options) {
    if (options === void 0) { options = {}; }
    return function (target, propKey) {
        var _a;
        var decoratorName = "@jsonSetMember on ".concat((0, helpers_1.nameof)(target.constructor), ".").concat(String(propKey));
        var typeThunk = (0, type_descriptor_1.ensureTypeThunk)(maybeTypeThunk, decoratorName);
        var reflectedType = helpers_1.isReflectMetadataSupported
            ? Reflect.getMetadata('design:type', target, propKey)
            : null;
        if (reflectedType != null && reflectedType !== Set && reflectedType !== Object) {
            (0, helpers_1.logError)("".concat(decoratorName, ": property is not a Set. ").concat(helpers_1.MISSING_REFLECT_CONF_MSG));
            return;
        }
        (0, metadata_1.injectMetadataInformation)(target, propKey, {
            type: function () { return (0, type_descriptor_1.SetT)(typeThunk()); },
            emitDefaultValue: options.emitDefaultValue,
            isRequired: options.isRequired,
            options: (0, options_base_1.extractOptionBase)(options),
            key: propKey.toString(),
            name: (_a = options.name) !== null && _a !== void 0 ? _a : propKey.toString(),
            deserializer: options.deserializer,
            serializer: options.serializer,
        });
    };
}
//# sourceMappingURL=json-set-member.js.map