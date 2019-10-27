module.exports = function(grunt) {
    // load grunt config
    require("load-grunt-config")(grunt, {
        // load grunt tasks
        loadGruntTasks: {
            scope: "devDependencies"
        },
    });
};
