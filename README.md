# Extended Require for Node.JS

Extends `require()` capabilities.

[![Build Status](https://travis-ci.org/samleybrize/node-extended-require.svg?branch=master)](https://travis-ci.org/samleybrize/node-extended-require)

## Installation

You can install with `npm`:

```bash
npm install node-extended-require
```

## Usage

```javascript
/* /path/to/project/index.js */

var er              = require("extended-require");
var extendedRequire = er.require;

// creates a new include path set
// only files under /path/to/project/lib will use that include path set
// you can create as many include path sets as you want
var includePath = er.newIncludePath("lib");

// add /path/to/project/lib to the include path
includePath.add(".");

// add /path/to/project/lib/other/dir to the include path
includePath.add("other/dir");

// ......

// will try to load in order (stops on the first found file/dir) :
// - /path/to/project/lib/dir/file
// - /path/to/project/lib/dir/file.js
// - /path/to/project/lib/other/dir/file
// - /path/to/project/lib/other/dir/file.js
// if none of these paths exists, "dir/file" is forwarded as is to the builtin require() function
var file = extendedRequire("dir/file");

// you can use the bind() function as well
extendedRequire.bind(extendedRequire, "dir/file");
```

## API

### newIncludePath(rootDirectory)

Creates a new include path set. The `rootDirectory` arg can be absolute or relative to the file that call it. This arg is used to filter include path sets. For example, if you set it to `/path/to/dir`,
only files that resides into that directory will use that include path set on a call to `require()`. For files that are outside that directory, this include path set will be ignored.

Returns an instance of `IncludePath`.

#### IncludePath.add(path)

Adds an include path to the include path set. The `path` arg is always relative to the root directory of the include path set. Note that only paths added with the `add()` method
will be used to require files/dirs (the root directory is only used as a filter). To include the root directory itself, use `includePath.add('.')`.

#### IncludePath.getRootDirectory()

Returns the root directory of the include path set.

#### IncludePath.reset()

Resets the include path set (the root directory is preserved).

#### IncludePath.isInRootDirectory(path)

Indicates if the `path` arg is in the root directory of the include path set. `path` must be absolute;

#### IncludePath.resolve(path)

Resolves a path. If the path is a JavaScript file, the '.js' extension can be omitted. The path is appended to each include path in the order they have been declared,
and the resulting absolute path is returned as soon as it exists on the filesystem. Returns null if no file were found. `path` is alwayd considered a relative path.

### resetIncludePathList()

Discards all include path sets.

### require(id, fallbackToBuiltin)

Requires a module using defined include path sets.

The `id` arg is the path to the module to be loaded and can be absolute or relative to one of include paths.

The `fallbackToBuiltin` arg indicates if the `id` arg has to be passed to the builtin `require()` function in case no include path set satisfies required `id`. Defaults to true.

## Author

This project is authored and maintained by Stephen Berquet.

## License

Licensed under the MIT License - see the [LICENSE](LICENSE) file for details
