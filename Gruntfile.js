module.exports = function(grunt) {
  grunt.loadNpmTasks('grunt-electron-installer')

  grunt.initConfig({
    'create-windows-installer': {
      x64: {
        appDirectory: '../hellobill-win32-x64',
        outputDirectory: '../output',
        exe: 'hellobill.exe',
       
        setupExe:'Hellobill.exe',
        remoteReleases: '',
        'signWithParams':' /a ',
        'iconUrl':'https://s3.amazonaws.com/www.hellobill.io/desktop-assets/hellobill.ico.ico',
        'loadingGif':'./resources/windows/hellobillinstaller.gif'
      }
    }
  });


  grunt.registerTask('default', ['create-windows-installer']);

};

