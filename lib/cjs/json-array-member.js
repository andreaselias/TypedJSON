"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.jsonArrayMember = jsonArrayMember;
exports.createArrayType = createArrayType;
var helpers_1 = require("./helpers");
var metadata_1 = require("./metadata");
var options_base_1 = require("./options-base");
var type_descriptor_1 = require("./type-descriptor");
function jsonArrayMember(maybeTypeThunk, options) {
    if (options === void 0) { options = {}; }
    return function (target, propKey) {
        var _a;
        var decoratorName = "@jsonArrayMember on ".concat((0, helpers_1.nameof)(target.constructor), ".").concat(String(propKey));
        var typeThunk = (0, type_descriptor_1.ensureTypeThunk)(maybeTypeThunk, decoratorName);
        var dimensions = options.dimensions == null ? 1 : options.dimensions;
        if (!isNaN(dimensions) && dimensions < 1) {
            (0, helpers_1.logError)("".concat(decoratorName, ": 'dimensions' option must be at least 1."));
            return;
        }
        var reflectedType = helpers_1.isReflectMetadataSupported
            ? Reflect.getMetadata('design:type', target, propKey)
            : null;
        if (reflectedType != null && reflectedType !== Array && reflectedType !== Object) {
            (0, helpers_1.logError)("".concat(decoratorName, ": property is not an Array. ").concat(helpers_1.MISSING_REFLECT_CONF_MSG));
            return;
        }
        (0, metadata_1.injectMetadataInformation)(target, propKey, {
            type: function () { return createArrayType((0, type_descriptor_1.ensureTypeDescriptor)(typeThunk()), dimensions); },
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
function createArrayType(elementType, dimensions) {
    var type = new type_descriptor_1.ArrayTypeDescriptor(elementType);
    for (var i = 1; i < dimensions; ++i) {
        type = new type_descriptor_1.ArrayTypeDescriptor(type);
    }
    return type;
}
//# sourceMappingURL=json-array-member.js.map