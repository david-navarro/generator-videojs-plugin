module.exports = function(grunt) {

  grunt.initConfig({

    banner: `
      /*! <%= pkg.name %> - v<%= pkg.version %>
       * Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author %>
       * Licensed <%= pkg.license %>
       */
    `,

    browserify: {
      options: {
        browserifyOptions: {
          standalone: '<%= pkg.name %>'
        },
        transform: [
          'babelify',
          'browserify-shim'
        ]
      },
      dist: {
        src: ['src/plugin.js'],
        dest: 'dist/<%= pkg.name %>.js'
      },
      test: {
        options: {
          browserifyOptions: {
            standalone: false
          }
        },
        src: ['test/unit/**/*.test.js'],
        dest: 'test/unit/dist/plugin.js'
      }
    },

    clean: {
      css: ['dist/**/*.css'],
      dist: ['dist'],
      js: ['dist/**/*.js']
    },

    concurrent: {
      options: {
        logConcurrentOutput: true
      },
      start: {
        tasks: ['connect:start', 'watch']
      }
    },

    connect: {
      options: {
        keepalive: true,
        livereload: true,
        useAvailablePort: true
      },
      start: {
        options: {
          port: 9999
        }
      }
    },

    pkg: grunt.file.readJSON('../package.json'),

    qunit: {
      unit: 'test/unit/index.html'
    },

    run: {
      lint: {
        exec: 'npm run lint'
      }
    },

    sass: {
      options: {
        outputStyle: 'compressed'
      },
      dist: {
        src: ['src/plugin.scss'],
        dest: 'dist/<%= pkg.name %>.css'
      }
    },

    uglify: {
      options: {
        preserveComments: 'some'
      },
      dist: {
        src: 'dist/<%= pkg.name %>.js',
        dest: 'dist/<%= pkg.name %>.min.js'
      }
    },

    usebanner: {
      options: {
        banner: '<%= banner %>'
      },
      css: {
        src: ['dist/<%= pkg.name %>.css']
      },
      js: {
        src: ['dist/<%= pkg.name %>.js']
      }
    },

    watch: {
      css: {
        files: '<%= sass.dist.src %>',
        tasks: ['build:css']
      },
      js: {
        files: 'src/**/*.js',
        tasks: ['lint', 'build:js']
      },
      test: {
        files: ['Gruntfile.js', 'test/**/*.test.js'],
        tasks: ['test']
      }
    }
  });

  require('load-grunt-tasks')(grunt);

  grunt.registerTask('build', [
    'clean:dist',
    'build:css',
    'build:js'
  ]);

  grunt.registerTask('build:css', [
    'clean:css',
    'sass:dist',
    'usebanner:css'
  ]);

  grunt.registerTask('build:js', [
    'clean:js',
    'browserify:dist',
    'usebanner:js',
    'uglify'
  ]);

  grunt.registerTask('default', [
    'test'
  ]);

  grunt.registerTask('lint', [
    'run:lint'
  ]);

  grunt.registerTask('start', [
    'concurrent:start'
  ]);

  grunt.registerTask('test', [
    'lint',
    'build',
    'browserify:test',
    'qunit'
  ]);
};
