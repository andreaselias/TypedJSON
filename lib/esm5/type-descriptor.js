import { __extends } from "tslib";
import { LAZY_TYPE_EXPLANATION } from './helpers';
var TypeDescriptor = (function () {
    function TypeDescriptor(ctor) {
        this.ctor = ctor;
    }
    TypeDescriptor.prototype.getTypes = function () {
        return [this.ctor];
    };
    TypeDescriptor.prototype.hasFriendlyName = function () {
        return this.ctor.name !== 'Object';
    };
    return TypeDescriptor;
}());
export { TypeDescriptor };
var ConcreteTypeDescriptor = (function (_super) {
    __extends(ConcreteTypeDescriptor, _super);
    function ConcreteTypeDescriptor(ctor) {
        return _super.call(this, ctor) || this;
    }
    return ConcreteTypeDescriptor;
}(TypeDescriptor));
export { ConcreteTypeDescriptor };
var GenericTypeDescriptor = (function (_super) {
    __extends(GenericTypeDescriptor, _super);
    function GenericTypeDescriptor(ctor) {
        return _super.call(this, ctor) || this;
    }
    return GenericTypeDescriptor;
}(TypeDescriptor));
export { GenericTypeDescriptor };
var ArrayTypeDescriptor = (function (_super) {
    __extends(ArrayTypeDescriptor, _super);
    function ArrayTypeDescriptor(elementType) {
        var _this = _super.call(this, Array) || this;
        _this.elementType = elementType;
        return _this;
    }
    ArrayTypeDescriptor.prototype.getTypes = function () {
        return _super.prototype.getTypes.call(this).concat(this.elementType.getTypes());
    };
    return ArrayTypeDescriptor;
}(GenericTypeDescriptor));
export { ArrayTypeDescriptor };
export function ArrayT(elementType) {
    return new ArrayTypeDescriptor(ensureTypeDescriptor(elementType));
}
var SetTypeDescriptor = (function (_super) {
    __extends(SetTypeDescriptor, _super);
    function SetTypeDescriptor(elementType) {
        var _this = _super.call(this, Set) || this;
        _this.elementType = elementType;
        return _this;
    }
    SetTypeDescriptor.prototype.getTypes = function () {
        return _super.prototype.getTypes.call(this).concat(this.elementType.getTypes());
    };
    return SetTypeDescriptor;
}(GenericTypeDescriptor));
export { SetTypeDescriptor };
export function SetT(elementType) {
    return new SetTypeDescriptor(ensureTypeDescriptor(elementType));
}
var MapTypeDescriptor = (function (_super) {
    __extends(MapTypeDescriptor, _super);
    function MapTypeDescriptor(keyType, valueType, options) {
        var _this = _super.call(this, Map) || this;
        _this.keyType = keyType;
        _this.valueType = valueType;
        _this.options = options;
        return _this;
    }
    MapTypeDescriptor.prototype.getTypes = function () {
        return _super.prototype.getTypes.call(this).concat(this.keyType.getTypes(), this.valueType.getTypes());
    };
    MapTypeDescriptor.prototype.getCompleteOptions = function () {
        var _a, _b;
        return {
            shape: (_b = (_a = this.options) === null || _a === void 0 ? void 0 : _a.shape) !== null && _b !== void 0 ? _b : 0,
        };
    };
    return MapTypeDescriptor;
}(GenericTypeDescriptor));
export { MapTypeDescriptor };
export function MapT(keyType, valueType, options) {
    return new MapTypeDescriptor(ensureTypeDescriptor(keyType), ensureTypeDescriptor(valueType), options);
}
export var AnyT = new ConcreteTypeDescriptor(function () { return undefined; });
export function isTypelike(type) {
    return type != null && (typeof type === 'function' || type instanceof TypeDescriptor);
}
export function isTypeThunk(candidate) {
    return typeof candidate === 'function' && candidate.name === '';
}
export function ensureTypeDescriptor(type) {
    return type instanceof TypeDescriptor ? type : new ConcreteTypeDescriptor(type);
}
export function ensureTypeThunk(typeThunkOrSerializable, decoratorName) {
    if (typeThunkOrSerializable == null) {
        throw new Error("No type given on ".concat(decoratorName, ". ").concat(LAZY_TYPE_EXPLANATION));
    }
    if (isTypeThunk(typeThunkOrSerializable)) {
        return typeThunkOrSerializable;
    }
    return function () { return typeThunkOrSerializable; };
}
//# sourceMappingURL=type-descriptor.js.map