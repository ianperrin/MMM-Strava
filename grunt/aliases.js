module.exports = {
    lint: [
        "eslint",
        "jshint",
        "jsonlint",
        "markdownlint",
        "stylelint",
        "yamllint"
    ],
    test: [
        "mochaTest",
        "eslint",
        "jshint",
        "jsonlint",
        "markdownlint",
        "stylelint",
        "yamllint"
    ],
    unit: [
        "mochaTest"
    ]
};