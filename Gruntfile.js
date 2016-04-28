module.exports = function(grunt) {
  grunt.loadNpmTasks('grunt-electron-installer')

  grunt.initConfig({
    'create-windows-installer': {
      x64: {
        appDirectory: 'hellobill-win32-x64',
        outputDirectory: './output',
        exe: 'hellobill.exe',
        noMsi: true,
        setupExe:'Hellobill.exe',
        remoteReleases: ''
      }
    }
  });


  grunt.registerTask('default', ['create-windows-installer']);

};
