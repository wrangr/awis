module.exports = function (grunt) {

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-nodeunit');

  grunt.initConfig({
    jshint: { all: [ '*.js' ] },
    nodeunit: { all: [ 'test.js' ] }
  });

  grunt.registerTask('default', [ 'jshint', 'nodeunit' ]);

};
