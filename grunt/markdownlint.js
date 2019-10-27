module.exports = {
    all: {
        options: {
            config: {
                "default": true,
                "line-length": false,
                "MD041": false,
            }
        },
        src: [
            "*.md",
            ".github/*.md",
            "**/*.md",
            "!node_modules/**"
        ]
    }
};