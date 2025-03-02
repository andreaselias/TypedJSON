"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.jsonMember = jsonMember;
var helpers_1 = require("./helpers");
var metadata_1 = require("./metadata");
var options_base_1 = require("./options-base");
var type_descriptor_1 = require("./type-descriptor");
function jsonMember(optionsOrPrototype, propertyKeyOrOptions) {
    if (typeof propertyKeyOrOptions === 'string' || typeof propertyKeyOrOptions === 'symbol') {
        var property = propertyKeyOrOptions;
        var prototype = optionsOrPrototype;
        var decoratorName = "@jsonMember on ".concat((0, helpers_1.nameof)(prototype.constructor), ".").concat(String(property));
        if (!helpers_1.isReflectMetadataSupported) {
            (0, helpers_1.logError)("".concat(decoratorName, ": ReflectDecorators is required if the type is not explicitly provided with e.g. @jsonMember(Number)"));
            return;
        }
        var reflectPropCtor = Reflect.getMetadata('design:type', prototype, property);
        if (reflectPropCtor == null) {
            (0, helpers_1.logError)("".concat(decoratorName, ": could not resolve detected property constructor at runtime. Potential solutions:\n - ").concat(helpers_1.LAZY_TYPE_EXPLANATION, "\n - ").concat(helpers_1.MISSING_REFLECT_CONF_MSG));
            return;
        }
        var typeDescriptor_1 = (0, type_descriptor_1.ensureTypeDescriptor)(reflectPropCtor);
        if (isSpecialPropertyType(decoratorName, typeDescriptor_1)) {
            return;
        }
        (0, metadata_1.injectMetadataInformation)(prototype, property, {
            type: function () { return typeDescriptor_1; },
            key: propertyKeyOrOptions.toString(),
            name: propertyKeyOrOptions.toString(),
        });
        return;
    }
    return jsonMemberDecoratorFactory(optionsOrPrototype, propertyKeyOrOptions);
}
function jsonMemberDecoratorFactory(optionsOrType, options) {
    return function (target, property) {
        var _a;
        var decoratorName = "@jsonMember on ".concat((0, helpers_1.nameof)(target.constructor), ".").concat(String(property));
        var typeThunk;
        if ((0, type_descriptor_1.isTypelike)(optionsOrType) || (0, type_descriptor_1.isTypeThunk)(optionsOrType)) {
            typeThunk = (0, type_descriptor_1.ensureTypeThunk)(optionsOrType, decoratorName);
        }
        else {
            options = optionsOrType;
        }
        options = options !== null && options !== void 0 ? options : {};
        if (Object.prototype.hasOwnProperty.call(options, 'constructor')) {
            if (typeThunk !== undefined) {
                throw new Error('Cannot both define constructor option and type. Only one allowed.');
            }
            if (!(0, helpers_1.isValueDefined)(options.constructor)) {
                (0, helpers_1.logError)("".concat(decoratorName, ": cannot resolve specified property constructor at runtime. ").concat(helpers_1.LAZY_TYPE_EXPLANATION));
                return;
            }
            var newTypeDescriptor_1 = (0, type_descriptor_1.ensureTypeDescriptor)(options.constructor);
            typeThunk = function () { return newTypeDescriptor_1; };
            if (helpers_1.isReflectMetadataSupported && !(0, helpers_1.isSubtypeOf)(newTypeDescriptor_1.ctor, Reflect.getMetadata('design:type', target, property))) {
                (0, helpers_1.logWarning)("".concat(decoratorName, ": detected property type does not match")
                    + " 'constructor' option.");
            }
        }
        else if (typeThunk !== undefined) {
        }
        else if (helpers_1.isReflectMetadataSupported) {
            var reflectCtor_1 = Reflect.getMetadata('design:type', target, property);
            if (reflectCtor_1 == null) {
                (0, helpers_1.logError)("".concat(decoratorName, ": cannot resolve detected property constructor at runtime. ").concat(helpers_1.LAZY_TYPE_EXPLANATION));
                return;
            }
            typeThunk = function () { return (0, type_descriptor_1.ensureTypeDescriptor)(reflectCtor_1); };
        }
        else if (options.deserializer === undefined) {
            (0, helpers_1.logError)("".concat(decoratorName, ": Cannot determine type"));
            return;
        }
        var typeToTest = typeThunk === null || typeThunk === void 0 ? void 0 : typeThunk();
        if (typeToTest !== undefined && isSpecialPropertyType(decoratorName, typeToTest)) {
            return;
        }
        (0, metadata_1.injectMetadataInformation)(target, property, {
            type: typeThunk === undefined
                ? undefined
                : function () { return (0, type_descriptor_1.ensureTypeDescriptor)(typeThunk()); },
            emitDefaultValue: options.emitDefaultValue,
            isRequired: options.isRequired,
            options: (0, options_base_1.extractOptionBase)(options),
            key: property.toString(),
            name: (_a = options.name) !== null && _a !== void 0 ? _a : property.toString(),
            deserializer: options.deserializer,
            serializer: options.serializer,
        });
    };
}
function isConstructorEqual(type, constructor) {
    return type instanceof type_descriptor_1.TypeDescriptor ? type.ctor === constructor : type === constructor;
}
function isSpecialPropertyType(decoratorName, typeDescriptor) {
    if (!(typeDescriptor instanceof type_descriptor_1.ArrayTypeDescriptor)
        && isConstructorEqual(typeDescriptor, Array)) {
        (0, helpers_1.logError)("".concat(decoratorName, ": property is an Array. Use the jsonArrayMember decorator to")
            + " serialize this property.");
        return true;
    }
    if (!(typeDescriptor instanceof type_descriptor_1.SetTypeDescriptor) && isConstructorEqual(typeDescriptor, Set)) {
        (0, helpers_1.logError)("".concat(decoratorName, ": property is a Set. Use the jsonSetMember decorator to")
            + " serialize this property.");
        return true;
    }
    if (!(typeDescriptor instanceof type_descriptor_1.MapTypeDescriptor) && isConstructorEqual(typeDescriptor, Map)) {
        (0, helpers_1.logError)("".concat(decoratorName, ": property is a Map. Use the jsonMapMember decorator to")
            + " serialize this property.");
        return true;
    }
    return false;
}
//# sourceMappingURL=json-member.js.map