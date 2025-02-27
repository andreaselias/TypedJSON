"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnyT = exports.MapTypeDescriptor = exports.SetTypeDescriptor = exports.ArrayTypeDescriptor = exports.GenericTypeDescriptor = exports.ConcreteTypeDescriptor = exports.TypeDescriptor = void 0;
exports.ArrayT = ArrayT;
exports.SetT = SetT;
exports.MapT = MapT;
exports.isTypelike = isTypelike;
exports.isTypeThunk = isTypeThunk;
exports.ensureTypeDescriptor = ensureTypeDescriptor;
exports.ensureTypeThunk = ensureTypeThunk;
var helpers_1 = require("./helpers");
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
exports.TypeDescriptor = TypeDescriptor;
var ConcreteTypeDescriptor = (function (_super) {
    __extends(ConcreteTypeDescriptor, _super);
    function ConcreteTypeDescriptor(ctor) {
        return _super.call(this, ctor) || this;
    }
    return ConcreteTypeDescriptor;
}(TypeDescriptor));
exports.ConcreteTypeDescriptor = ConcreteTypeDescriptor;
var GenericTypeDescriptor = (function (_super) {
    __extends(GenericTypeDescriptor, _super);
    function GenericTypeDescriptor(ctor) {
        return _super.call(this, ctor) || this;
    }
    return GenericTypeDescriptor;
}(TypeDescriptor));
exports.GenericTypeDescriptor = GenericTypeDescriptor;
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
exports.ArrayTypeDescriptor = ArrayTypeDescriptor;
function ArrayT(elementType) {
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
exports.SetTypeDescriptor = SetTypeDescriptor;
function SetT(elementType) {
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
exports.MapTypeDescriptor = MapTypeDescriptor;
function MapT(keyType, valueType, options) {
    return new MapTypeDescriptor(ensureTypeDescriptor(keyType), ensureTypeDescriptor(valueType), options);
}
exports.AnyT = new ConcreteTypeDescriptor(function () { return undefined; });
function isTypelike(type) {
    return type != null && (typeof type === 'function' || type instanceof TypeDescriptor);
}
function isTypeThunk(candidate) {
    return typeof candidate === 'function' && candidate.name === '';
}
function ensureTypeDescriptor(type) {
    return type instanceof TypeDescriptor ? type : new ConcreteTypeDescriptor(type);
}
function ensureTypeThunk(typeThunkOrSerializable, decoratorName) {
    if (typeThunkOrSerializable == null) {
        throw new Error("No type given on ".concat(decoratorName, ". ").concat(helpers_1.LAZY_TYPE_EXPLANATION));
    }
    if (isTypeThunk(typeThunkOrSerializable)) {
        return typeThunkOrSerializable;
    }
    return function () { return typeThunkOrSerializable; };
}
//# sourceMappingURL=type-descriptor.js.map