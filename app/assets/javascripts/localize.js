function setCurrentLocale(locale) {
    window.currentLocale = locale;
}
function getCurrentLocale() {
    if(!window.currentLocale) window.currentLocale = 'en';
    return window.currentLocale;
}
function localize(key, params) {
    if(!params) params = {};
    var keys = key.split(".");
    var rawResult = window.wordings[getCurrentLocale()];
    while(keys.length > 0) {
        if(!rawResult) {
            return "Missing wording: " + getCurrentLocale() + "." + key;
        }
        var currentKey = keys.shift();
        rawResult = rawResult[currentKey];
    }
    var regexp = /%{([a-zA-Z_]*)}/;
    var lastMatch = rawResult.match(regexp);

    while(lastMatch) {
        rawResult = rawResult.replace(regexp, params[lastMatch[1]]);
        lastMatch = rawResult.match(regexp);
    }
    return rawResult;
}