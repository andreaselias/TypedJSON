"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MapTypeDescriptor = exports.ArrayTypeDescriptor = exports.SetTypeDescriptor = exports.MapT = exports.SetT = exports.AnyT = exports.ArrayT = exports.toJson = exports.jsonMapMember = exports.jsonSetMember = exports.jsonArrayMember = exports.jsonMember = exports.jsonObject = exports.JsonObjectMetadata = exports.defaultTypeEmitter = exports.defaultTypeResolver = exports.TypedJSON = void 0;
var parser_1 = require("./parser");
Object.defineProperty(exports, "TypedJSON", { enumerable: true, get: function () { return parser_1.TypedJSON; } });
Object.defineProperty(exports, "defaultTypeResolver", { enumerable: true, get: function () { return parser_1.defaultTypeResolver; } });
Object.defineProperty(exports, "defaultTypeEmitter", { enumerable: true, get: function () { return parser_1.defaultTypeEmitter; } });
var metadata_1 = require("./metadata");
Object.defineProperty(exports, "JsonObjectMetadata", { enumerable: true, get: function () { return metadata_1.JsonObjectMetadata; } });
var json_object_1 = require("./json-object");
Object.defineProperty(exports, "jsonObject", { enumerable: true, get: function () { return json_object_1.jsonObject; } });
var json_member_1 = require("./json-member");
Object.defineProperty(exports, "jsonMember", { enumerable: true, get: function () { return json_member_1.jsonMember; } });
var json_array_member_1 = require("./json-array-member");
Object.defineProperty(exports, "jsonArrayMember", { enumerable: true, get: function () { return json_array_member_1.jsonArrayMember; } });
var json_set_member_1 = require("./json-set-member");
Object.defineProperty(exports, "jsonSetMember", { enumerable: true, get: function () { return json_set_member_1.jsonSetMember; } });
var json_map_member_1 = require("./json-map-member");
Object.defineProperty(exports, "jsonMapMember", { enumerable: true, get: function () { return json_map_member_1.jsonMapMember; } });
var to_json_1 = require("./to-json");
Object.defineProperty(exports, "toJson", { enumerable: true, get: function () { return to_json_1.toJson; } });
var type_descriptor_1 = require("./type-descriptor");
Object.defineProperty(exports, "ArrayT", { enumerable: true, get: function () { return type_descriptor_1.ArrayT; } });
Object.defineProperty(exports, "AnyT", { enumerable: true, get: function () { return type_descriptor_1.AnyT; } });
Object.defineProperty(exports, "SetT", { enumerable: true, get: function () { return type_descriptor_1.SetT; } });
Object.defineProperty(exports, "MapT", { enumerable: true, get: function () { return type_descriptor_1.MapT; } });
Object.defineProperty(exports, "SetTypeDescriptor", { enumerable: true, get: function () { return type_descriptor_1.SetTypeDescriptor; } });
Object.defineProperty(exports, "ArrayTypeDescriptor", { enumerable: true, get: function () { return type_descriptor_1.ArrayTypeDescriptor; } });
Object.defineProperty(exports, "MapTypeDescriptor", { enumerable: true, get: function () { return type_descriptor_1.MapTypeDescriptor; } });
__exportStar(require("./types"), exports);
//# sourceMappingURL=index.js.map