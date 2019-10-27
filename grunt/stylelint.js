module.exports = {
    simple: {
        options: {
            configFile: ".stylelintrc"
        },
        src: [
            "*.css",
            "**/*.css",
            "!node_modules/**"
        ]
    }
};