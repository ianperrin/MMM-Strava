module.exports = function(grunt) {
    grunt.initConfig({
        mochaTest: {
            test: {
                options: {
                    reporter: "spec",
                    //captureFile: 'results.txt', // Optionally capture the reporter output to a file
                    //quiet: false, // Optionally suppress output to standard out (defaults to false)
                    //clearRequireCache: false, // Optionally clear the require cache before running tests (defaults to false)
                    //clearCacheFilter: (key) => true, // Optionally defines which files should keep in cache
                    //noFail: false // Optionally set to not fail on failed tests (will still fail on other errors)
                },
                src: ["tests/**/*.js"]
            }
        },
        eslint: {
            options: {
                configFile: ".eslintrc.json"
            },
            target: [
                "*.js",
                "!(node_modules)/*.js"
            ]
        },
        jshint: {
            options: {
                jshintrc: ".jshintrc"
            },
            all: [
                "*.js",
                "!(node_modules)/*.js"
            ]
        },
        jsonlint: {
            main: {
                src: [
                    "package.json",
                    ".eslintrc.json",
                    ".stylelintrc",
                    "translations/*.json"
                ],
                options: {
                    reporter: "jshint"
                }
            }
        },
        markdownlint: {
            all: {
                options: {
                    config: {
                        "default": true,
                        "line-length": false,
                        "MD041": false,
                    }
                },
                src: [
                    "README.md",
                    ".github/*.md"
                ]
            }
        },
        stylelint: {
            simple: {
                options: {
                    configFile: ".stylelintrc"
                },
                src: [
                    "*.css"
                ]
            }
        },
        yamllint: {
            all: [
                ".travis.yml"
            ]
        }
    });

    grunt.loadNpmTasks("grunt-mocha-test");
    grunt.loadNpmTasks("grunt-contrib-jshint");
    grunt.loadNpmTasks("grunt-eslint");
    grunt.loadNpmTasks("grunt-jsonlint");
    grunt.loadNpmTasks("grunt-markdownlint");
    grunt.loadNpmTasks("grunt-stylelint");
    grunt.loadNpmTasks("grunt-yamllint");

    grunt.registerTask("unit", ["mochaTest"]);
    grunt.registerTask("lint", ["eslint", "jshint", "jsonlint", "markdownlint", "stylelint", "yamllint"]);
    grunt.registerTask("test", ["mochaTest", "eslint", "jshint", "jsonlint", "markdownlint", "stylelint", "yamllint"]);
};