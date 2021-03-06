/*
 * This file is part of node-extended-require.
 *
 * (c) Stephen Berquet <stephen.berquet@gmail.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

"use strict";

var path            = require("path");
var fs              = require("fs");
var pathIsAbsolute  = require('path-is-absolute');

/**
 * @param {string} rootDirectory - Root directory of this include path set
 * @param {string} [name] - Name of this include path set
 */
function IncludePath(rootDirectory, name) {
    var given = null;

    if ("string" !== typeof rootDirectory) {
        given = typeof rootDirectory;
        throw new Error("'rootDirectory' must be a string, [" + given + "] given");
    } else if (!pathIsAbsolute(rootDirectory)) {
        throw new Error("'rootDirectory' must be an absolute path");
    } else if (name && "string" !== typeof name) {
        given = typeof name;
        throw new Error("'name' must be a string, [" + given + "] given");
    } else if (name && 0 === name.length) {
        throw new Error("'name' cannot be an empty string");
    }

    this._name              = name || null;
    this._rootDirectory     = path.resolve(rootDirectory);
    this._includePathList   = [];
    this._includePathCache  = {};
}

/**
 * Returns the root directory of this include path set
 * @returns {string}
 */
IncludePath.prototype.getRootDirectory = function() {
    return this._rootDirectory;
};

/**
 * Returns the name of this include path set
 * @returns {string|null}
 */
IncludePath.prototype.getName = function() {
    return this._name;
};

/**
 * Adds an include path to this include path set
 * @param {string} pathToAdd - The path to add. Must be relative to the root directory of this include path set.
 * @returns {IncludePath}
 */
IncludePath.prototype.add = function(pathToAdd) {
    if ("string" !== typeof pathToAdd) {
        var given = typeof pathToAdd;
        throw new Error("'pathToAdd' must be a string, [" + given + "] given");
    }

    pathToAdd = path.resolve(this._rootDirectory, path.join(this._rootDirectory, pathToAdd));
    this._includePathList.push(pathToAdd);

    return this;
};

/**
 * Resets the include path set
 * @returns {IncludePath}
 */
IncludePath.prototype.reset = function() {
    this._includePathList   = [];
    this._includePathCache  = {};

    return this;
};

/**
 * Indicates if a given path is in the root directory of this include path set
 * @param {string} pathToResolve - Must be an absolute path
 * @returns {boolean}
 */
IncludePath.prototype.isInRootDirectory = function(pathToResolve) {
    if ("string" !== typeof pathToResolve) {
        var given = typeof pathToResolve;
        throw new Error("'pathToResolve' must be a string, [" + given + "] given");
    } else if (!pathIsAbsolute(pathToResolve)) {
        throw new Error("'pathToResolve' must be an absolute path");
    }

    // verify if given path fit in root directory
    pathToResolve   = path.resolve(pathToResolve);
    var root        = this._rootDirectory + "/";
    var p           = pathToResolve + "/";

    if (0 !== p.indexOf(root)) {
        return false;
    }

    return true;
};

/**
 * Resolves a path.
 * If the path is a JavaScript file, the '.js' extension can be omitted.
 * The path is appended to each include path in the order they have been declared,
 * and the resulting absolute path is returned as soon as it exists on the filesystem.
 * Returns null if no file were found.
 * @param {string} pathToResolve
 * @returns {string|null}
 */
IncludePath.prototype.resolve = function(pathToResolve) {
    if ("string" !== typeof pathToResolve) {
        var given = typeof pathToResolve;
        throw new Error("'pathToResolve' must be a string, [" + given + "] given");
    }

    if (undefined !== this._includePathCache[pathToResolve]) {
        return this._includePathCache[pathToResolve];
    }

    // iterate over all include paths and return once a file exists
    for (var i in this._includePathList) {
        var p1 = path.join(this._includePathList[i], pathToResolve);
        var p2 = p1 + ".js";

        if (fs.existsSync(p1)) {
            this._includePathCache[pathToResolve] = p1;
            return p1;
        } else if (fs.existsSync(p2)) {
            this._includePathCache[pathToResolve] = p2;
            return p2;
        }
    }

    // no file found
    this._includePathCache[pathToResolve] = null;
    return null;
};

// exports
module.exports = IncludePath;
