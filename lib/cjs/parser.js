"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TypedJSON = exports.defaultTypeEmitter = exports.defaultTypeResolver = void 0;
var deserializer_1 = require("./deserializer");
Object.defineProperty(exports, "defaultTypeResolver", { enumerable: true, get: function () { return deserializer_1.defaultTypeResolver; } });
var helpers_1 = require("./helpers");
var json_array_member_1 = require("./json-array-member");
var metadata_1 = require("./metadata");
var options_base_1 = require("./options-base");
var serializer_1 = require("./serializer");
Object.defineProperty(exports, "defaultTypeEmitter", { enumerable: true, get: function () { return serializer_1.defaultTypeEmitter; } });
var type_descriptor_1 = require("./type-descriptor");
var TypedJSON = (function () {
    function TypedJSON(rootConstructor, settings) {
        this.serializer = new serializer_1.Serializer();
        this.deserializer = new deserializer_1.Deserializer();
        this.globalKnownTypes = [];
        this.indent = 0;
        var rootMetadata = metadata_1.JsonObjectMetadata.getFromConstructor(rootConstructor);
        if (rootMetadata === undefined
            || (!rootMetadata.isExplicitlyMarked && !rootMetadata.isHandledWithoutAnnotation)) {
            throw new TypeError('The TypedJSON root data type must have the @jsonObject decorator used.');
        }
        this.nameResolver = function (ctor) { return (0, helpers_1.nameof)(ctor); };
        this.rootConstructor = rootConstructor;
        this.errorHandler = function (error) { return (0, helpers_1.logError)(error); };
        this.config(settings);
    }
    TypedJSON.parse = function (object, rootType, settings) {
        return new TypedJSON(rootType, settings).parse(object);
    };
    TypedJSON.parseAsArray = function (object, elementType, settings, dimensions) {
        return new TypedJSON(elementType, settings).parseAsArray(object, dimensions);
    };
    TypedJSON.parseAsSet = function (object, elementType, settings) {
        return new TypedJSON(elementType, settings).parseAsSet(object);
    };
    TypedJSON.parseAsMap = function (object, keyType, valueType, settings) {
        return new TypedJSON(valueType, settings).parseAsMap(object, keyType);
    };
    TypedJSON.toPlainJson = function (object, rootType, settings) {
        return new TypedJSON(rootType, settings).toPlainJson(object);
    };
    TypedJSON.toPlainArray = function (object, elementType, dimensions, settings) {
        return new TypedJSON(elementType, settings).toPlainArray(object, dimensions);
    };
    TypedJSON.toPlainSet = function (object, elementType, settings) {
        return new TypedJSON(elementType, settings).toPlainSet(object);
    };
    TypedJSON.toPlainMap = function (object, keyCtor, valueCtor, settings) {
        return new TypedJSON(valueCtor, settings).toPlainMap(object, keyCtor);
    };
    TypedJSON.stringify = function (object, rootType, settings) {
        return new TypedJSON(rootType, settings).stringify(object);
    };
    TypedJSON.stringifyAsArray = function (object, elementType, dimensions, settings) {
        return new TypedJSON(elementType, settings).stringifyAsArray(object, dimensions);
    };
    TypedJSON.stringifyAsSet = function (object, elementType, settings) {
        return new TypedJSON(elementType, settings).stringifyAsSet(object);
    };
    TypedJSON.stringifyAsMap = function (object, keyCtor, valueCtor, settings) {
        return new TypedJSON(valueCtor, settings).stringifyAsMap(object, keyCtor);
    };
    TypedJSON.setGlobalConfig = function (config) {
        Object.assign(this._globalConfig, config);
    };
    TypedJSON.mapType = function (type, converters) {
        if (this._globalConfig.mappedTypes == null) {
            this._globalConfig.mappedTypes = new Map();
        }
        this._globalConfig.mappedTypes.set(type, converters);
    };
    TypedJSON.prototype.config = function (settings) {
        var _this = this;
        settings = __assign(__assign({}, TypedJSON._globalConfig), settings);
        if (settings.knownTypes != null
            && TypedJSON._globalConfig.knownTypes != null) {
            settings.knownTypes = Array.from(new Set(settings.knownTypes.concat(TypedJSON._globalConfig.knownTypes)));
        }
        var options = (0, options_base_1.extractOptionBase)(settings);
        this.serializer.options = options;
        this.deserializer.options = options;
        if (settings.errorHandler != null) {
            this.errorHandler = settings.errorHandler;
            this.deserializer.setErrorHandler(settings.errorHandler);
            this.serializer.setErrorHandler(settings.errorHandler);
        }
        if (settings.replacer != null) {
            this.replacer = settings.replacer;
        }
        if (settings.typeResolver != null) {
            this.deserializer.setTypeResolver(settings.typeResolver);
        }
        if (settings.typeHintEmitter != null) {
            this.serializer.setTypeHintEmitter(settings.typeHintEmitter);
        }
        if (settings.indent != null) {
            this.indent = settings.indent;
        }
        if (settings.mappedTypes != null) {
            settings.mappedTypes.forEach(function (upDown, type) {
                _this.setSerializationStrategies(type, upDown);
            });
        }
        if (settings.nameResolver != null) {
            this.nameResolver = settings.nameResolver;
            this.deserializer.setNameResolver(settings.nameResolver);
        }
        if (settings.knownTypes != null) {
            settings.knownTypes.forEach(function (knownType, i) {
                if (typeof knownType === 'undefined' || knownType === null) {
                    (0, helpers_1.logWarning)("TypedJSON.config: 'knownTypes' contains an undefined/null value"
                        + " (element ".concat(i, ")."));
                }
            });
            this.globalKnownTypes = settings.knownTypes;
        }
    };
    TypedJSON.prototype.mapType = function (type, converters) {
        this.setSerializationStrategies(type, converters);
    };
    TypedJSON.prototype.parse = function (object) {
        var json = (0, helpers_1.parseToJSObject)(object, this.rootConstructor);
        var result;
        try {
            result = this.deserializer.convertSingleValue(json, (0, type_descriptor_1.ensureTypeDescriptor)(this.rootConstructor), this.getKnownTypes());
        }
        catch (e) {
            this.errorHandler(e);
        }
        return result;
    };
    TypedJSON.prototype.parseAsArray = function (object, dimensions) {
        if (dimensions === void 0) { dimensions = 1; }
        var json = (0, helpers_1.parseToJSObject)(object, Array);
        return this.deserializer.convertSingleValue(json, (0, json_array_member_1.createArrayType)((0, type_descriptor_1.ensureTypeDescriptor)(this.rootConstructor), dimensions), this._mapKnownTypes(this.globalKnownTypes));
    };
    TypedJSON.prototype.parseAsSet = function (object) {
        var json = (0, helpers_1.parseToJSObject)(object, Set);
        return this.deserializer.convertSingleValue(json, (0, type_descriptor_1.SetT)(this.rootConstructor), this._mapKnownTypes(this.globalKnownTypes));
    };
    TypedJSON.prototype.parseAsMap = function (object, keyConstructor) {
        var json = (0, helpers_1.parseToJSObject)(object, Map);
        return this.deserializer.convertSingleValue(json, (0, type_descriptor_1.MapT)(keyConstructor, this.rootConstructor), this._mapKnownTypes(this.globalKnownTypes));
    };
    TypedJSON.prototype.toPlainJson = function (object) {
        try {
            return this.serializer.convertSingleValue(object, (0, type_descriptor_1.ensureTypeDescriptor)(this.rootConstructor));
        }
        catch (e) {
            this.errorHandler(e);
        }
    };
    TypedJSON.prototype.toPlainArray = function (object, dimensions) {
        if (dimensions === void 0) { dimensions = 1; }
        try {
            return this.serializer.convertSingleValue(object, (0, json_array_member_1.createArrayType)((0, type_descriptor_1.ensureTypeDescriptor)(this.rootConstructor), dimensions));
        }
        catch (e) {
            this.errorHandler(e);
        }
    };
    TypedJSON.prototype.toPlainSet = function (object) {
        try {
            return this.serializer.convertSingleValue(object, (0, type_descriptor_1.SetT)(this.rootConstructor));
        }
        catch (e) {
            this.errorHandler(e);
        }
    };
    TypedJSON.prototype.toPlainMap = function (object, keyConstructor) {
        try {
            return this.serializer.convertSingleValue(object, (0, type_descriptor_1.MapT)(keyConstructor, this.rootConstructor));
        }
        catch (e) {
            this.errorHandler(e);
        }
    };
    TypedJSON.prototype.stringify = function (object) {
        var result = this.toPlainJson(object);
        if (result === undefined) {
            return '';
        }
        return JSON.stringify(result, this.replacer, this.indent);
    };
    TypedJSON.prototype.stringifyAsArray = function (object, dimensions) {
        return JSON.stringify(this.toPlainArray(object, dimensions), this.replacer, this.indent);
    };
    TypedJSON.prototype.stringifyAsSet = function (object) {
        return JSON.stringify(this.toPlainSet(object), this.replacer, this.indent);
    };
    TypedJSON.prototype.stringifyAsMap = function (object, keyConstructor) {
        return JSON.stringify(this.toPlainMap(object, keyConstructor), this.replacer, this.indent);
    };
    TypedJSON.prototype.getKnownTypes = function () {
        var _this = this;
        var rootMetadata = metadata_1.JsonObjectMetadata.getFromConstructor(this.rootConstructor);
        var knownTypes = new Map();
        this.globalKnownTypes.filter(function (ktc) { return ktc; }).forEach(function (knownTypeCtor) {
            knownTypes.set(_this.nameResolver(knownTypeCtor), knownTypeCtor);
        });
        if (rootMetadata !== undefined) {
            rootMetadata.processDeferredKnownTypes();
            rootMetadata.knownTypes.forEach(function (knownTypeCtor) {
                knownTypes.set(_this.nameResolver(knownTypeCtor), knownTypeCtor);
            });
        }
        return knownTypes;
    };
    TypedJSON.prototype._mapKnownTypes = function (constructors) {
        var _this = this;
        var map = new Map();
        constructors.filter(function (ctor) { return ctor; }).forEach(function (ctor) { return map.set(_this.nameResolver(ctor), ctor); });
        return map;
    };
    TypedJSON.prototype.setSerializationStrategies = function (type, converters) {
        var _this = this;
        if (converters.deserializer != null) {
            this.deserializer.setDeserializationStrategy(type, function (value) { return converters.deserializer(value, {
                fallback: function (so, td) { return _this.deserializer.convertSingleValue(so, (0, type_descriptor_1.ensureTypeDescriptor)(td), _this.getKnownTypes()); },
            }); });
        }
        if (converters.serializer != null) {
            this.serializer.setSerializationStrategy(type, function (value) { return converters.serializer(value, {
                fallback: function (so, td) { return _this.serializer.convertSingleValue(so, (0, type_descriptor_1.ensureTypeDescriptor)(td)); },
            }); });
        }
    };
    TypedJSON._globalConfig = {};
    return TypedJSON;
}());
exports.TypedJSON = TypedJSON;
//# sourceMappingURL=parser.js.map