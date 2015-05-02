var extendedRequire = require("..");
var IncludePath     = require("../lib/include-path");
var chai            = require("chai");
var proxyquire      = require('proxyquire').noPreserveCache();

describe("extended-require", function() {
    beforeEach("Clear include path list", function() {
        extendedRequire.resetIncludePathList();
    });

    describe(".newIncludePath()", function() {
        it("throw if not a string", function() {
            chai.expect(extendedRequire.newIncludePath.bind(extendedRequire, 4)).to.throw("'rootDirectory' must be a string, [number] given");
        });

        it("absolute path", function() {
            var o = extendedRequire.newIncludePath("/path/to/root");
            chai.expect(o.getRootDirectory()).to.equal("/path/to/root");
        });

        it("relative path", function() {
            var o = extendedRequire.newIncludePath("./test");
            chai.expect(o.getRootDirectory()).to.equal(__dirname + "/test");
        });
    });

    describe(".require()", function() {
        it("throw if pathToRequire is not a string", function() {
            chai.expect(extendedRequire.require.bind(extendedRequire, 4)).to.throw("'pathToRequire' must be a string, [number] given");
        });

        it("throw if include path set identifier is not a string", function() {
            chai.expect(extendedRequire.require.bind(extendedRequire, [4, "test"])).to.throw("Include path set identifier must be a string, [number] given");
            chai.expect(extendedRequire.require.bind(extendedRequire, ["", "test"])).to.throw("Include path set identifier must be a string, [object] given");
        });

        it("throw if no file found and no fallback", function() {
            extendedRequire.newIncludePath("/directory/that/does/not/exists", "idtest");
            chai.expect(extendedRequire.require.bind(extendedRequire, "somefile", false)).to.throw("No include path set satisfies 'somefile' from '" + __filename + "'");
            chai.expect(extendedRequire.require.bind(extendedRequire, ["idtest", "somefile"], false)).to.throw("Include path set 'idtest' does not satisfies 'somefile'");
        });

        it("throw if include path set id not found", function() {
            extendedRequire.newIncludePath("/directory/that/does/not/exists", "idtest");
            chai.expect(extendedRequire.require.bind(extendedRequire, ["idnotfound", "somefile"], false)).to.throw("No include path set with id 'idnotfound' found");
        });

        it("no file found with fallback", function() {
            extendedRequire.newIncludePath(__dirname).add("fixtures");
            var o = extendedRequire.require("chai");
            chai.expect(o).to.equal(chai);
        });

        it("no file found with identifier", function() {
            extendedRequire.newIncludePath(__dirname, "idtest").add("fixtures");
            chai.expect(extendedRequire.require.bind(extendedRequire, ["idtest", "chai"], false)).to.throw("Include path set 'idtest' does not satisfies 'chai'");
            chai.expect(extendedRequire.require.bind(extendedRequire, ["idtest", "chai"], true)).to.throw("Include path set 'idtest' does not satisfies 'chai'");
        });

        it("no file found with identifier and path cache", function() {
            extendedRequire.newIncludePath(__dirname, "idtest").add("fixtures");
            var o = extendedRequire.require("chai");
            chai.expect(extendedRequire.require.bind(extendedRequire, ["idtest", "chai"])).to.throw("Include path set 'idtest' does not satisfies 'chai'");
        });

        it("file found", function() {
            extendedRequire.newIncludePath(__dirname).add("fixtures").add("fixtures/include-path");

            var o1              = extendedRequire.require("include-path/to-be-included");
            var o2              = extendedRequire.require("include-path/to-be-included.js");
            var o3              = extendedRequire.require("to-be-included");
            var expectedPath    = __dirname + "/fixtures/include-path/to-be-included.js";

            chai.expect(o1.fullpath).to.equal(expectedPath);
            chai.expect(o2.fullpath).to.equal(expectedPath);
            chai.expect(o3.fullpath).to.equal(expectedPath);
        });

        it("file found with identifier", function() {
            extendedRequire.newIncludePath(__dirname).add("fixtures/include-path");
            extendedRequire.newIncludePath(__dirname, "idtest").add("fixtures/include-path2");

            var o1              = extendedRequire.require(["idtest", "to-be-included"]);
            var o2              = extendedRequire.require("to-be-included");
            var expectedPath1   = __dirname + "/fixtures/include-path2/to-be-included.js";
            var expectedPath2   = __dirname + "/fixtures/include-path/to-be-included.js";

            chai.expect(o1.fullpath).to.equal(expectedPath1);
            chai.expect(o2.fullpath).to.equal(expectedPath2);
        });
    });

    describe(".require() + package.json", function() {
        it("invalid 'extended-require'", function() {
            var fn = extendedRequire.require.bind(extendedRequire, "test", false, __dirname + "/fixtures/package-json/invalid-extended-require");
            chai.expect(fn).to.throw("'extended-require' config must be an array");
        });

        it("invalid 'extended-require' entry", function() {
            var fn = extendedRequire.require.bind(extendedRequire, "test", false, __dirname + "/fixtures/package-json/invalid-extended-require-entry");
            chai.expect(fn).to.throw("'extended-require:0' config must be an object");
        });

        it("invalid root directory", function() {
            var fn = extendedRequire.require.bind(extendedRequire, "test", false, __dirname + "/fixtures/package-json/invalid-rootdirectory");
            chai.expect(fn).to.throw("Required 'extended-require:0:rootDirectory' config must be a non-empty string");
        });

        it("invalid id", function() {
            var fn = extendedRequire.require.bind(extendedRequire, "test", false, __dirname + "/fixtures/package-json/invalid-id");
            chai.expect(fn).to.throw("Optional 'extended-require:0:id' config must be a non-empty string");
        });

        it("invalid include-path", function() {
            var fn = extendedRequire.require.bind(extendedRequire, "test", false, __dirname + "/fixtures/package-json/invalid-includepath");
            chai.expect(fn).to.throw("Required 'extended-require:0:include-path' config must be an array");
        });

        it("invalid include-path entry", function() {
            var fn = extendedRequire.require.bind(extendedRequire, "test", false, __dirname + "/fixtures/package-json/invalid-includepath-entry");
            chai.expect(fn).to.throw("'extended-require:0:include-path:1' config must be a non-empty string");
        });

        it("no package.json", function() {
            chai.expect(extendedRequire.require("chai", true, "../..")).to.equal(chai);
        });

        it("no config", function() {
            chai.expect(extendedRequire.require("chai", true, "..")).to.equal(chai);
        });

        it("valid", function() {
            var o1 = extendedRequire.require("toload", false, __dirname + "/fixtures/package-json/valid/other-dir");
            var o2 = extendedRequire.require(["idtest", "toload"], false, __dirname + "/fixtures/package-json/valid");

            chai.expect(o1).to.equal(__dirname + "/fixtures/package-json/valid/lib2/toload.js");
            chai.expect(o2).to.equal(__dirname + "/fixtures/package-json/valid/lib/toload.js");
        });

        it("package.json config not loaded twice", function() {
            var loadHasBeenCalled   = false;
            var disablePjd          = false;
            var pjdStub             = {
                load: function(path) {
                    if (disablePjd) {
                        loadHasBeenCalled = true;
                        throw new Error("package-json-discover.load() has been called");
                    } else {
                        return require("package-json-discover").load(path);
                    }
                },
                discover: function(path) {
                    return require("package-json-discover").discover(path);
                },
                "@noCallThru": true
            };
            var extendedRequireStubbed = proxyquire("..", {
                "package-json-discover": pjdStub
            });

            // require to trigger config load
            var o1 = extendedRequireStubbed.require("toload", false, __dirname + "/fixtures/package-json/valid");
            chai.expect(o1).to.equal(__dirname + "/fixtures/package-json/valid/lib2/toload.js");

            // disable package-json-discover.load() that is used internally
            disablePjd = true;
            var o2 = extendedRequireStubbed.require("toload", false, __dirname + "/fixtures/package-json/valid");
            chai.expect(loadHasBeenCalled).to.equal(false);
        });
    });
});
