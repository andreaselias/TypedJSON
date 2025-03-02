"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toJson = toJson;
var parser_1 = require("./parser");
function toJson(optionsOrTarget) {
    if (typeof optionsOrTarget === 'function') {
        toJsonDecorator(optionsOrTarget, {});
        return;
    }
    return function (target) {
        toJsonDecorator(target, optionsOrTarget);
    };
}
function toJsonDecorator(target, options) {
    if (options.overwrite !== true && target.prototype.toJSON !== undefined) {
        throw new Error("".concat(target.name, " already has toJSON defined!"));
    }
    target.prototype.toJSON = function toJSON() {
        return parser_1.TypedJSON.toPlainJson(this, Object.getPrototypeOf(this).constructor);
    };
}
//# sourceMappingURL=to-json.js.map