module.exports = function(grunt) {
  grunt.initConfig({
    nodeunit: {
      all: ["test/**/*.test.js"]
    },
    jshint: {
      all: ["*.js"]
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
    }
  });

  grunt.loadNpmTasks("grunt-contrib-jshint");
  grunt.loadNpmTasks("grunt-contrib-nodeunit");
  grunt.loadNpmTasks("grunt-markdownlint");

  grunt.registerTask("test", ["jshint", "nodeunit", "markdownlint"]);
};