module.exports = {
    main: {
        src: [
            ".stylelintrc",
            "*.json",
            "**/*.json",
            "!node_modules/**"
        ],
        options: {
            reporter: "jshint"
        }
    }
};