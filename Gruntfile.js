module.exports = function(grunt) {
  grunt.loadNpmTasks('grunt-electron-installer')

  grunt.initConfig({
    'create-windows-installer': {
      x64: {
        appDirectory: '/Users/ariclasry/Desktop/hellobill-win32-x64',
        outputDirectory: '/Users/ariclasry/Desktop/',
        authors: 'My App Inc.',
        exe: 'myapp.exe'
      },
      ia32: {
        appDirectory: '/Users/ariclasry/Desktop/hellobill-win32-x64',
        outputDirectory: '/Users/ariclasry/Desktop/',
        authors: 'My App Inc.',
        exe: 'myapp.exe'
      }
    }
  });


  grunt.registerTask('default', ['create-windows-installer']);

};
