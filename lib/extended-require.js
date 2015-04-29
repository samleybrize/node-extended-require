/*
 * This file is part of node-extended-require.
 *
 * (c) Stephen Berquet <stephen.berquet@gmail.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

"use strict";

var path                    = require("path");
var IncludePath             = require("./include-path");
var pathIsAbsolute          = require('path-is-absolute');

var includePathSetList      = [];
var includePathSetListById  = {};

/**
 * Creates a new include path set
 * @param {string} rootDirectory - Root directory of the include path set. Can be absolute or relative to the calling file.
 * @param {string} [id] - Include path set identifier
 * @returns {IncludePath}
 */
function newIncludePath(rootDirectory, id) {
    // if rootDirectory is relative, make it absolute
    if ("string" !== typeof rootDirectory) {
        var given = typeof rootDirectory;
        throw new Error("'rootDirectory' must be a string, [" + given + "] given");
    } else if (!pathIsAbsolute(rootDirectory)) {
        var callerDir   = path.dirname(getCallerFile());
        rootDirectory   = path.join(callerDir, rootDirectory);
        rootDirectory   = path.resolve(rootDirectory);
    }

    // ensure that the id is not used
    for (var i in includePathSetList) {
        var iId = includePathSetList[i].getName();

        if (null !== iId && iId == id) {
            throw new Error("Include path set identifier '" + id + "' is already used");
        }
    }

    // create include path set and append it to the list
    var includePath = new IncludePath(rootDirectory, id);
    addIncludePath(includePath);

    return includePath;
}

/**
 * Adds an include path set to the include path set list
 * @param {IncludePath} includePath
 */
function addIncludePath(includePath) {
    includePathSetList.push(includePath);
    var name = includePath.getName();

    if (null !== name) {
        includePathSetListById[name] = includePath;
    }
}

/**
 * Resets the include path list
 */
function resetIncludePathList() {
    includePathSetList      = [];
    includePathSetListById  = {};
}

/**
 * Require a module using include path sets
 * @param {string|Array} id - Path to the module to be loaded. Can be absolute or relative to one of include paths.
 * @param {boolean} [fallbackToBuiltin] - Indicates if the id has to be passed to the
 * builtin require() function in case no include path set satisfies required id. Defaults to true.
 * @param {string} [callerFile] - Full path of the calling file. If not provided, it is determined automatically.
 */
function extendedRequire(id, fallbackToBuiltin, callerFile) {
    callerFile              = callerFile || getCallerFile();
    fallbackToBuiltin       = (undefined === fallbackToBuiltin) ? true : !!fallbackToBuiltin;
    var includePathSetId    = null;

    if (id instanceof Array) {
        // first element is the id
        // second element is the include path set id
        // TODO check array length?

        var idArray         = id;
        id                  = idArray.shift() || null;
        includePathSetId    = idArray.shift() || null;
    }

    if ("string" !== typeof id) {
        var given = typeof id;
        throw new Error("'id' must be a string, [" + given + "] given");
    }

    // use include path sets
    var resolvedPath = null;

    if (null !== includePathSetId) {
        // use the include path set referenced by the identifier
        if (!includePathSetListById[includePathSetId]) {
            throw new Error("No include path set with id '" + includePathSetId + "' found");
        }

        // trying to resolve path
        resolvedPath = includePathSetListById[includePathSetId].resolve(id);

        if (null !== resolvedPath) {
            // builtin require
            return require(resolvedPath);
        }
    } else {
        // iterate over all include path sets
        for (var i in includePathSetList) {
            // verify if the caller file is in the root directory of the include path set
            // if an include path set identifier is given,
            if (!includePathSetList[i].isInRootDirectory(callerFile)) {
                continue;
            }

            // trying to resolve path
            resolvedPath = includePathSetList[i].resolve(id);

            if (null === resolvedPath) {
                continue;
            }

            // builtin require
            return require(resolvedPath);
        }
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
 * Override bind() function to integrate automating discovering of the caller file at bind time
 * @param thisArg
 * @param {string} id - Path to the module to be loaded. Can be absolute or relative to one of include paths.
 * @param {boolean} [fallbackToBuiltin] - Indicates if the id has to be passed to the
 * builtin require() function in case no include path set satisfies required id. Defaults to true.
 * @param {string} [callerFile] - Full path of the calling file. If not provided, it is determined automatically.
 * @returns Function
 */
extendedRequire.bind = function(thisArg, id, fallbackToBuiltin, callerFile) {
    callerFile = callerFile || getCallerFile();
    return Function.prototype.bind.call(extendedRequire, thisArg, id, fallbackToBuiltin, callerFile);
};

/**
 * Returns the file path in which a function in this module was called
 * @returns {string|null}
 */
function getCallerFile() {
    try {
        var origPrepareStackTrace   = Error.prepareStackTrace;
        var err                     = new Error();
        Error.prepareStackTrace     = function (err, stack) {
            return stack;
        };
        var stack                   = err.stack;
        Error.prepareStackTrace     = origPrepareStackTrace;

        var currentfile             = err.stack.shift().getFileName();
        var callerfile              = null;

        while (stack.length) {
            callerfile = stack.shift().getFileName();

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
    newIncludePath: newIncludePath,
    resetIncludePathList: resetIncludePathList
};
