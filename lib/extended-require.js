var path                = require("path");
var IncludePath         = require("./include-path");
var pathIsAbsolute      = require('path-is-absolute');

var includePathSetList  = [];

/**
 * Creates a new include path set
 * @param {string} rootDirectory - Root directory of the include path set. Can be absolute or relative to the calling file.
 * @returns {IncludePath}
 */
function newIncludePath(rootDirectory) {
    // if rootDirectory is relative, make it absolute
    if (!pathIsAbsolute(rootDirectory)) {
        var callerDir   = path.dirname(getCallerFile());
        rootDirectory   = path.join(callerDir, rootDirectory);
        rootDirectory   = path.resolve(rootDirectory);
    }

    var includePath = new IncludePath(rootDirectory);
    addIncludePath(includePath);

    return includePath;
}

/**
 * Adds an include path set to the include path set list
 * @param {IncludePath} includePath
 */
function addIncludePath(includePath) {
    includePathSetList.push(includePath);
}

/**
 * Require a module using include path sets
 * @param {string} id - Path to the module to be loaded. Can be absolute or relative to one of include paths.
 * @param {boolean} [fallbackToBuiltin] - Indicates if the id has to be passed to the
 * builtin require() function in case no include path set satisfies required id. Defaults to true.
 */
function extendedRequire(id, fallbackToBuiltin) {
    var callerFile      = getCallerFile();
    fallbackToBuiltin   = (undefined === fallbackToBuiltin) ? true : !!fallbackToBuiltin;

    if ("string" !== typeof id) {
        var given = typeof id;
        throw new Error("'id' must be a string, [" + given + "] given");
    }

    // iterate over all include path sets
    for (var i in includePathSetList) {
        // verify if the caller file is in the root directory of the include path set
        if (!includePathSetList[i].isInRootDirectory(callerFile)) {
            continue;
        }

        // trying to resolve path
        var resolvedPath = includePathSetList[i].resolve(id);

        if (null === resolvedPath) {
            continue;
        }

        // builtin require
        return require(resolvedPath);
    }

    // no include path set satisfies required id
    if (!fallbackToBuiltin) {
        // fallback to builtin require() function has been refused
        // throw an exception
        throw new Error("No include path set satisfies '" + id + "' from '" + callerFile + "'");
    }

    return require(id);
}

/**
 * Returns the file path in which a function in this module was called
 * @returns {string|null}
 */
function getCallerFile() {
    try {
        var err                 = new Error();
        Error.prepareStackTrace = function (err, stack) { return stack; };

        var currentfile         = err.stack.shift().getFileName();
        var callerfile          = null;

        while (err.stack.length) {
            callerfile = err.stack.shift().getFileName();

            if (currentfile !== callerfile) {
                return callerfile;
            }
        }
    } catch (e) {}

    return null;
}

// exports
module.exports = {
    require: extendedRequire,
    newIncludePath: newIncludePath
};
