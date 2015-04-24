var path    = require("path");
var fs      = require("fs");

// TODO cache resolved files

/**
 * @param {string} rootDirectory - Root directory of this include path set
 */
function IncludePath(rootDirectory) {
    if ("string" !== typeof rootDirectory) {
        var given = typeof rootDirectory;
        throw new Error("'rootDirectory' must be a string, [" + given + "] given");
    } else if (!path.isAbsolute(rootDirectory)) {
        throw new Error("'rootDirectory' must be an absolute path");
    }

    this._rootDirectory     = path.resolve(rootDirectory);
    this._includePathList   = [];
}

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
    this._includePathList = [];

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
    } else if (!path.isAbsolute(pathToResolve)) {
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

    // iterate over all include paths and return once a file exists
    for (var i in this._includePathList) {
        var p1 = path.join(this._includePathList[i], pathToResolve);
        var p2 = p1 + ".js";

        if (fs.existsSync(p1)) {
            return p1;
        } else if (fs.existsSync(p2)) {
            return p2;
        }
    }

    // no file found
    return null;
};

// exports
module.exports = IncludePath;
