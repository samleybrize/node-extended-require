var extendedRequire = require("..");
var IncludePath     = require("../lib/include-path");
var chai            = require("chai");

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
});
