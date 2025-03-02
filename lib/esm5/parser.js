import { __assign } from "tslib";
import { defaultTypeResolver, Deserializer } from './deserializer';
import { logError, logWarning, nameof, parseToJSObject } from './helpers';
import { createArrayType } from './json-array-member';
import { JsonObjectMetadata, } from './metadata';
import { extractOptionBase } from './options-base';
import { defaultTypeEmitter, Serializer } from './serializer';
import { ensureTypeDescriptor, MapT, SetT } from './type-descriptor';
export { defaultTypeResolver, defaultTypeEmitter };
var TypedJSON = (function () {
    function TypedJSON(rootConstructor, settings) {
        this.serializer = new Serializer();
        this.deserializer = new Deserializer();
        this.globalKnownTypes = [];
        this.indent = 0;
        var rootMetadata = JsonObjectMetadata.getFromConstructor(rootConstructor);
        if (rootMetadata === undefined
            || (!rootMetadata.isExplicitlyMarked && !rootMetadata.isHandledWithoutAnnotation)) {
            throw new TypeError('The TypedJSON root data type must have the @jsonObject decorator used.');
        }
        this.nameResolver = function (ctor) { return nameof(ctor); };
        this.rootConstructor = rootConstructor;
        this.errorHandler = function (error) { return logError(error); };
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
        var options = extractOptionBase(settings);
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
                    logWarning("TypedJSON.config: 'knownTypes' contains an undefined/null value"
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
        var json = parseToJSObject(object, this.rootConstructor);
        var result;
        try {
            result = this.deserializer.convertSingleValue(json, ensureTypeDescriptor(this.rootConstructor), this.getKnownTypes());
        }
        catch (e) {
            this.errorHandler(e);
        }
        return result;
    };
    TypedJSON.prototype.parseAsArray = function (object, dimensions) {
        if (dimensions === void 0) { dimensions = 1; }
        var json = parseToJSObject(object, Array);
        return this.deserializer.convertSingleValue(json, createArrayType(ensureTypeDescriptor(this.rootConstructor), dimensions), this._mapKnownTypes(this.globalKnownTypes));
    };
    TypedJSON.prototype.parseAsSet = function (object) {
        var json = parseToJSObject(object, Set);
        return this.deserializer.convertSingleValue(json, SetT(this.rootConstructor), this._mapKnownTypes(this.globalKnownTypes));
    };
    TypedJSON.prototype.parseAsMap = function (object, keyConstructor) {
        var json = parseToJSObject(object, Map);
        return this.deserializer.convertSingleValue(json, MapT(keyConstructor, this.rootConstructor), this._mapKnownTypes(this.globalKnownTypes));
    };
    TypedJSON.prototype.toPlainJson = function (object) {
        try {
            return this.serializer.convertSingleValue(object, ensureTypeDescriptor(this.rootConstructor));
        }
        catch (e) {
            this.errorHandler(e);
        }
    };
    TypedJSON.prototype.toPlainArray = function (object, dimensions) {
        if (dimensions === void 0) { dimensions = 1; }
        try {
            return this.serializer.convertSingleValue(object, createArrayType(ensureTypeDescriptor(this.rootConstructor), dimensions));
        }
        catch (e) {
            this.errorHandler(e);
        }
    };
    TypedJSON.prototype.toPlainSet = function (object) {
        try {
            return this.serializer.convertSingleValue(object, SetT(this.rootConstructor));
        }
        catch (e) {
            this.errorHandler(e);
        }
    };
    TypedJSON.prototype.toPlainMap = function (object, keyConstructor) {
        try {
            return this.serializer.convertSingleValue(object, MapT(keyConstructor, this.rootConstructor));
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
        var rootMetadata = JsonObjectMetadata.getFromConstructor(this.rootConstructor);
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
                fallback: function (so, td) { return _this.deserializer.convertSingleValue(so, ensureTypeDescriptor(td), _this.getKnownTypes()); },
            }); });
        }
        if (converters.serializer != null) {
            this.serializer.setSerializationStrategy(type, function (value) { return converters.serializer(value, {
                fallback: function (so, td) { return _this.serializer.convertSingleValue(so, ensureTypeDescriptor(td)); },
            }); });
        }
    };
    TypedJSON._globalConfig = {};
    return TypedJSON;
}());
export { TypedJSON };
//# sourceMappingURL=parser.js.map