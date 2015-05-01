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
var caller                  = require("caller");
var IncludePath             = require("./include-path");
var pathIsAbsolute          = require("path-is-absolute");
var packageJsonDiscover     = require("package-json-discover");

var includePathSetList      = [];
var includePathSetListById  = {};
var packageJsonLoadedList   = [];

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
        var callerDir   = path.dirname(caller());
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
    packageJsonLoadedList   = [];
}

/**
 * Require a module using include path sets
 * @param {string|Array} pathToRequire - Path to the module to be loaded. Can be absolute or relative to one of include paths.
 * You can specify an include path set identifier with an array [identifier, pathToRequire]. In that case, only the include path set
 * referenced by the identifier will be used.
 * @param {boolean} [fallbackToBuiltin] - Indicates if the id has to be passed to the
 * builtin require() function in case no include path set satisfies required id. Defaults to true if 'pathToRequire' is a string.
 * If 'pathToRequire' is an array, 'fallbackToBuiltin' is always false.
 * @param {string} [callerFile] - Full path of the calling file. If not provided, it is determined automatically.
 */
function extendedRequire(pathToRequire, fallbackToBuiltin, callerFile) {
    callerFile              = callerFile || caller();
    fallbackToBuiltin       = (undefined === fallbackToBuiltin) ? true : !!fallbackToBuiltin;
    var includePathSetId    = null;
    var given               = null;

    if (pathToRequire instanceof Array) {
        // first element is the path to require
        // second element is the include path set id
        if (2 != pathToRequire.length) {
            throw new Error("'pathToRequire' as an array must contain exaclty 2 elements, " + pathToRequire.length + " given");
        }

        includePathSetId    = pathToRequire.shift() || null;
        pathToRequire       = pathToRequire.shift() || null;

        // check include path set identifier
        if ("string" !== typeof includePathSetId) {
            given = typeof includePathSetId;
            throw new Error("Include path set identifier must be a string, [" + given + "] given");
        }
    }

    if ("string" !== typeof pathToRequire) {
        given = typeof pathToRequire;
        throw new Error("'pathToRequire' must be a string, [" + given + "] given");
    }

    // load include path sets configured
    loadSetsFromConfigFile(callerFile);

    // use include path sets
    var resolvedPath = null;

    if (null !== includePathSetId) {
        // use the include path set referenced by the identifier
        if (!includePathSetListById[includePathSetId]) {
            throw new Error("No include path set with id '" + includePathSetId + "' found");
        }

        // trying to resolve path
        resolvedPath = includePathSetListById[includePathSetId].resolve(pathToRequire);

        if (null !== resolvedPath) {
            // builtin require
            return require(resolvedPath);
        }

        // file was not found
        throw new Error("Include path set '" + includePathSetId + "' does not satisfies '" + pathToRequire + "'");
    } else {
        // iterate over all include path sets
        for (var i in includePathSetList) {
            // verify if the caller file is in the root directory of the include path set
            // if an include path set identifier is given,
            if (!includePathSetList[i].isInRootDirectory(callerFile)) {
                continue;
            }

            // trying to resolve path
            resolvedPath = includePathSetList[i].resolve(pathToRequire);

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
        throw new Error("No include path set satisfies '" + pathToRequire + "' from '" + callerFile + "'");
    }

    return require(pathToRequire);
}

/**
 * Override bind() function to integrate automating discovering of the caller file at bind time
 * @param thisArg
 * @param {string} id - Path to the module to be loaded. Can be absolute or relative to one of include paths.
 * @param {boolean} [fallbackToBuiltin] - Indicates if the id has to be passed to the
 * builtin require() function in case no include path set satisfies required id. Defaults to true.
 * @param {string} [callerFile] - Full path of the calling file. If not provided, it is determined automatically.
 * @returns {Function}
 */
extendedRequire.bind = function(thisArg, id, fallbackToBuiltin, callerFile) {
    callerFile = callerFile || caller();
    return Function.prototype.bind.call(extendedRequire, thisArg, id, fallbackToBuiltin, callerFile);
};

/**
 * Loads include path sets from the closest package.json file
 * @param {string} from - Path from which to find the closest package.json file
 */
function loadSetsFromConfigFile(from) {
    var packageJson     = null;
    var packageJsonPath = null;

    try {
        // load each package.json only once
        packageJsonPath = packageJsonDiscover.discover(from);

        if (-1 !== packageJsonLoadedList.indexOf(packageJsonPath)) {
            return;
        }

        packageJson = packageJsonDiscover.load(from);
        packageJsonLoadedList.push(packageJsonPath);
    } catch (err) {
        return;
    }

    // check if "extended-require" exists
    if (!packageJson["extended-require"]) {
        // no "extended-require" config
        return;
    } else if ("object" != typeof packageJson["extended-require"]) {
        // invalid "extended-require" config
        throw new Error("'extended-require' config must be an array");
    }

    // process each config in "extended-require"
    for (var i in packageJson["extended-require"]) {
        var config = packageJson["extended-require"][i];

        // verify values
        if ("object" !== typeof config) {
            throw new Error("'extended-require:" + i + "' config must be an object");
        } else if ("string" !== typeof config.rootDirectory || 0 === config.rootDirectory.length) {
            throw new Error("Required 'extended-require:" + i + ":rootDirectory' config must be a non-empty string");
        } else if (undefined !== config.id && ("string" !== typeof config.id || 0 === config.rootDirectory.id)) {
            throw new Error("Optional 'extended-require:" + i + ":id' config must be a non-empty string");
        } else if ("object" !== typeof config["include-path"]) {
            throw new Error("Required 'extended-require:" + i + ":include-path' config must be an array");
        }

        // if defined rootDirectory is relative (to the package.json file), make it absolute
        var rootDirectory = config.rootDirectory;

        if (!pathIsAbsolute(rootDirectory)) {
            rootDirectory = path.join(path.dirname(packageJsonPath), rootDirectory);
            rootDirectory = path.resolve(rootDirectory);
        }

        // create include path set
        var includePath = new IncludePath(rootDirectory, config.id);

        for (var j in config["include-path"]) {
            // verify value
            if ("string" !== typeof config["include-path"][j] || 0 === config["include-path"][j].length) {
                throw new Error("'extended-require:" + i + ":include-path:" + j + "' config must be a non-empty string");
            }

            includePath.add(config["include-path"][j]);
        }

        addIncludePath(includePath);
    }
}

// exports
module.exports = {
    require: extendedRequire,
    newIncludePath: newIncludePath,
    resetIncludePathList: resetIncludePathList
};
