import { isReflectMetadataSupported, isSubtypeOf, isValueDefined, LAZY_TYPE_EXPLANATION, logError, logWarning, MISSING_REFLECT_CONF_MSG, nameof, } from './helpers';
import { injectMetadataInformation, } from './metadata';
import { extractOptionBase } from './options-base';
import { ArrayTypeDescriptor, ensureTypeDescriptor, ensureTypeThunk, isTypelike, isTypeThunk, MapTypeDescriptor, SetTypeDescriptor, TypeDescriptor, } from './type-descriptor';
export function jsonMember(optionsOrPrototype, propertyKeyOrOptions) {
    if (typeof propertyKeyOrOptions === 'string' || typeof propertyKeyOrOptions === 'symbol') {
        var property = propertyKeyOrOptions;
        var prototype = optionsOrPrototype;
        var decoratorName = "@jsonMember on ".concat(nameof(prototype.constructor), ".").concat(String(property));
        if (!isReflectMetadataSupported) {
            logError("".concat(decoratorName, ": ReflectDecorators is required if the type is not explicitly provided with e.g. @jsonMember(Number)"));
            return;
        }
        var reflectPropCtor = Reflect.getMetadata('design:type', prototype, property);
        if (reflectPropCtor == null) {
            logError("".concat(decoratorName, ": could not resolve detected property constructor at runtime. Potential solutions:\n - ").concat(LAZY_TYPE_EXPLANATION, "\n - ").concat(MISSING_REFLECT_CONF_MSG));
            return;
        }
        var typeDescriptor_1 = ensureTypeDescriptor(reflectPropCtor);
        if (isSpecialPropertyType(decoratorName, typeDescriptor_1)) {
            return;
        }
        injectMetadataInformation(prototype, property, {
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
        var decoratorName = "@jsonMember on ".concat(nameof(target.constructor), ".").concat(String(property));
        var typeThunk;
        if (isTypelike(optionsOrType) || isTypeThunk(optionsOrType)) {
            typeThunk = ensureTypeThunk(optionsOrType, decoratorName);
        }
        else {
            options = optionsOrType;
        }
        options = options !== null && options !== void 0 ? options : {};
        if (Object.prototype.hasOwnProperty.call(options, 'constructor')) {
            if (typeThunk !== undefined) {
                throw new Error('Cannot both define constructor option and type. Only one allowed.');
            }
            if (!isValueDefined(options.constructor)) {
                logError("".concat(decoratorName, ": cannot resolve specified property constructor at runtime. ").concat(LAZY_TYPE_EXPLANATION));
                return;
            }
            var newTypeDescriptor_1 = ensureTypeDescriptor(options.constructor);
            typeThunk = function () { return newTypeDescriptor_1; };
            if (isReflectMetadataSupported && !isSubtypeOf(newTypeDescriptor_1.ctor, Reflect.getMetadata('design:type', target, property))) {
                logWarning("".concat(decoratorName, ": detected property type does not match")
                    + " 'constructor' option.");
            }
        }
        else if (typeThunk !== undefined) {
        }
        else if (isReflectMetadataSupported) {
            var reflectCtor_1 = Reflect.getMetadata('design:type', target, property);
            if (reflectCtor_1 == null) {
                logError("".concat(decoratorName, ": cannot resolve detected property constructor at runtime. ").concat(LAZY_TYPE_EXPLANATION));
                return;
            }
            typeThunk = function () { return ensureTypeDescriptor(reflectCtor_1); };
        }
        else if (options.deserializer === undefined) {
            logError("".concat(decoratorName, ": Cannot determine type"));
            return;
        }
        var typeToTest = typeThunk === null || typeThunk === void 0 ? void 0 : typeThunk();
        if (typeToTest !== undefined && isSpecialPropertyType(decoratorName, typeToTest)) {
            return;
        }
        injectMetadataInformation(target, property, {
            type: typeThunk === undefined
                ? undefined
                : function () { return ensureTypeDescriptor(typeThunk()); },
            emitDefaultValue: options.emitDefaultValue,
            isRequired: options.isRequired,
            options: extractOptionBase(options),
            key: property.toString(),
            name: (_a = options.name) !== null && _a !== void 0 ? _a : property.toString(),
            deserializer: options.deserializer,
            serializer: options.serializer,
        });
    };
}
function isConstructorEqual(type, constructor) {
    return type instanceof TypeDescriptor ? type.ctor === constructor : type === constructor;
}
function isSpecialPropertyType(decoratorName, typeDescriptor) {
    if (!(typeDescriptor instanceof ArrayTypeDescriptor)
        && isConstructorEqual(typeDescriptor, Array)) {
        logError("".concat(decoratorName, ": property is an Array. Use the jsonArrayMember decorator to")
            + " serialize this property.");
        return true;
    }
    if (!(typeDescriptor instanceof SetTypeDescriptor) && isConstructorEqual(typeDescriptor, Set)) {
        logError("".concat(decoratorName, ": property is a Set. Use the jsonSetMember decorator to")
            + " serialize this property.");
        return true;
    }
    if (!(typeDescriptor instanceof MapTypeDescriptor) && isConstructorEqual(typeDescriptor, Map)) {
        logError("".concat(decoratorName, ": property is a Map. Use the jsonMapMember decorator to")
            + " serialize this property.");
        return true;
    }
    return false;
}
//# sourceMappingURL=json-member.js.map