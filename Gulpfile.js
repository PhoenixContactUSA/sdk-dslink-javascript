var gulp = require('gulp'),
    source = require('vinyl-source-stream'),
    buffer = require('vinyl-buffer'),
    run = require('run-sequence');

gulp.task('lint/lib', function() {
  var jshint = require('gulp-jshint');
  return gulp.src('lib/**/*.js')
    .pipe(jshint())
    .pipe(jshint.reporter('jshint-stylish'));
});

gulp.task('lint/index', function() {
  var jshint = require('gulp-jshint');
  return gulp.src('index.js')
    .pipe(jshint())
    .pipe(jshint.reporter('jshint-stylish'));
});

gulp.task('lint', function(cb) {
  run(
    'lint/index',
    'lint/lib',
    cb
  );
});

gulp.task('mocha', function() {
  var mocha = require('gulp-mocha');
  return gulp.src('test/', {
    read: false
  }).pipe(mocha({ reporter: 'spec' }));
});

gulp.task('coverage', function (cb) {
  var istanbul = require('gulp-istanbul');
  var mocha = require('gulp-mocha');
  gulp.src(['lib/**/*.js', 'index.js'])
    .pipe(istanbul()) // Covering files
    .pipe(istanbul.hookRequire()) // Force `require` to return covered files
    .on('finish', function () {
      gulp.src(['test/*.js'])
        .pipe(mocha())
        .pipe(istanbul.writeReports({
          reporters:['lcov', 'text-summary']
        })) // Creating the reports after tests runned
        .on('end', cb);
    });
});

gulp.task('test', function(cb) {
  run(
    'lint',
    'mocha',
    cb
  );
});

gulp.task('browser', function() {
  var browserify = require('browserify');
  var uglify = require('gulp-uglify');

  var bundler = browserify({
    entries: ['./index.js'],
    standalone: 'DS'
  });

  var bundle = function() {
    return bundler
      .bundle()
      .pipe(source('dslink.js'))
      .pipe(buffer())
      .pipe(uglify())
      .pipe(gulp.dest('dist/'));
  };

  return bundle();
});

gulp.task('docs', function(done) {
  var Dgeni = require('dgeni');
  var dgeni = new Dgeni([require('./docs/dsa-docs')]);
  return dgeni.generate();
});

gulp.task('connect', function() {
  var connect = require('gulp-connect');
  connect.server({
    port: 8000
  });
})
