var IncludePath = require("../lib/include-path");
var chai        = require("chai");

describe("IncludePath", function() {
    describe("Constructor", function() {
        it("throw if not a string", function() {
            chai.expect(function() {
                var o = new IncludePath(4);
            }).to.throw("'rootDirectory' must be a string, [number] given");
        });

        it("throw if not an absolute path", function() {
            chai.expect(function() {
                var o = new IncludePath("./root");
            }).to.throw("'rootDirectory' must be an absolute path");
        });
    });

    describe(".isInRootDirectory()", function() {
       it("correctly detect", function() {
           var o = new IncludePath("/path/to/root");

           chai.expect(o.isInRootDirectory("/path/to/root/sub/test.js")).to.equal(true);
           chai.expect(o.isInRootDirectory("/path/to/other/directory")).to.equal(false);
           chai.expect(o.isInRootDirectory("/path/to")).to.equal(false);
       });

       it("throw if not a string", function() {
           var o = new IncludePath("/path/to/root");

           chai.expect(o.isInRootDirectory.bind(o, 4)).to.throw("'pathToResolve' must be a string, [number] given");
       });

       it("throw if not an absolute path", function() {
           var o = new IncludePath("/path/to/root");

           chai.expect(o.isInRootDirectory.bind(o, "./test")).to.throw("'pathToResolve' must be an absolute path");
       });
   });

   describe(".resolve()", function() {
       it("return expected value", function() {
           var o = new IncludePath(__dirname);
           o.add("./fixtures/include-path");
           o.add("./fixtures/include-path/sub");

           chai.expect(o.resolve("to-be-included")).to.equal(__dirname + "/fixtures/include-path/to-be-included.js");
           chai.expect(o.resolve("to-be-included.js")).to.equal(__dirname + "/fixtures/include-path/to-be-included.js");
           chai.expect(o.resolve("/to-be-included.js")).to.equal(__dirname + "/fixtures/include-path/to-be-included.js");

           chai.expect(o.resolve("to-be-included-sub")).to.equal(__dirname + "/fixtures/include-path/sub/to-be-included-sub.js");
           chai.expect(o.resolve("sub/to-be-included-sub")).to.equal(__dirname + "/fixtures/include-path/sub/to-be-included-sub.js");

           chai.expect(o.resolve("not-exists")).to.equal(null);

           chai.expect(o.resolve(".")).to.equal(__dirname + "/fixtures/include-path");
           chai.expect(o.resolve("..")).to.equal(__dirname + "/fixtures");
       });

       it("throw if not a string", function() {
           var o = new IncludePath("/path/to/root");

           chai.expect(o.resolve.bind(o, 4)).to.throw("'pathToResolve' must be a string, [number] given");
       });
   });

   describe(".add()", function() {
       it("throw if not a string", function() {
           var o = new IncludePath("/path/to/root");

           chai.expect(o.add.bind(o, 4)).to.throw("'pathToAdd' must be a string, [number] given");
       });
   });

   describe(".reset()", function() {
       it("reset include path list", function() {
           var o = new IncludePath(__dirname);
           o.add("./fixtures/include-path");
           o.reset();

           chai.expect(o.resolve("to-be-included")).to.equal(null);
       });
   });
});
