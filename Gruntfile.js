module.exports = function(grunt){
   // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    jshint: {
      all:['Gruntfile.js','lib/*.js','lib/public/js/*.js']
    }
  });

  // Load the plugin that provides the "uglify" task.
  grunt.loadNpmTasks('grunt-contrib-jshint');
};
