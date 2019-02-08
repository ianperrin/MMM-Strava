module.exports = function(grunt) {
    grunt.initConfig({
        nodeunit: {
            all: ["test/**/*.test.js"]
        },
        eslint: {
            options: {
                configFile: ".eslintrc.json"
            },
            target: [
                "*.js"
            ]
        },
        jshint: {
            all: ["*.js"]
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
                        "line-length": false
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

    grunt.loadNpmTasks("grunt-contrib-jshint");
    grunt.loadNpmTasks("grunt-contrib-nodeunit");
    grunt.loadNpmTasks("grunt-eslint");
    grunt.loadNpmTasks("grunt-jsonlint");
    grunt.loadNpmTasks("grunt-markdownlint");
    grunt.loadNpmTasks("grunt-stylelint");
    grunt.loadNpmTasks("grunt-yamllint");

    grunt.registerTask("test", ["nodeunit", "eslint", "jshint", "jsonlint", "markdownlint", "stylelint", "yamllint"]);
};