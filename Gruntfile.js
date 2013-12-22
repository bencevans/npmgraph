'use strict';

module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    jshint: {

      options: {
        jshintrc: '.jshintrc',
        ignores: [
          '*.min.js',
          'node_modules/**/*',
          'public/bower_components/**/*',
          'dist/**/*',
          'coverage/**/*',
          'public/js/analytics.min.js'
        ]
      },

      all: [
        '*.js',
        '**/*.js'
      ],

    }

  });

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks('grunt-contrib-jshint');

  grunt.registerTask('lint', ['jshint']);

  if(process.env.TEST_CMD) {
    grunt.registerTask('travis', process.env.TEST_CMD);
  }

  // By default, lint and run all tests.
  grunt.registerTask('default', ['jshint']);

};
