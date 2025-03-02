const kAllOptions = [
    'preserveNull',
];
export function extractOptionBase(from) {
    const options = Object.keys(from)
        .filter(key => kAllOptions.indexOf(key) > -1)
        .reduce((obj, key) => {
        obj[key] = from[key];
        return obj;
    }, {});
    return Object.keys(options).length > 0 ? options : undefined;
}
export function getDefaultOptionOf(key) {
    switch (key) {
        case 'preserveNull':
            return false;
    }
    return null;
}
export function getOptionValue(key, options) {
    if (options != null && options[key] != null) {
        return options[key];
    }
    return getDefaultOptionOf(key);
}
export function mergeOptions(existing, moreSpecific) {
    return moreSpecific == null
        ? existing
        : Object.assign(Object.assign({}, existing), moreSpecific);
}
//# sourceMappingURL=options-base.js.map