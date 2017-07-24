import gulp from 'gulp'
import mocha from 'gulp-mocha'
import babel from 'gulp-babel'
import del from 'del'

function getMocha () {
  return mocha({
    compilers: 'js:babel-core/register',
    reporter: 'spec'
  })
}

function getBuildMocha () {
  return mocha({
    reporter: 'tap'
  })
}

gulp.task('test', function () {
  return gulp.src('es6/**/*.unit.js', {read: false})
    // `gulp-mocha` needs filepaths so you can't have any plugins before it 
    .pipe(getMocha())
})

gulp.task('test-integrations', function () {
  return gulp.src('es6/**/*.integration.js', {read: false})
    // `gulp-mocha` needs filepaths so you can't have any plugins before it 
    .pipe(getMocha())
})

gulp.task('test-build', function () {
  return gulp.src('lib/**/*.unit.js', {read: false})
    // `gulp-mocha` needs filepaths so you can't have any plugins before it 
    .pipe(getBuildMocha())
})

gulp.task('test-build-integrations', function () {
  return gulp.src('lib/**/*.integration.js', {read: false})
    // `gulp-mocha` needs filepaths so you can't have any plugins before it 
    .pipe(getBuildMocha())
})

gulp.task('clean-build', function() {
  return del(['lib'])
})

gulp.task('build', ['clean-build'], function () {
  return gulp.src('es6/**/*.js')
    .pipe(babel({
      presets: ['env']
    }))
    .pipe(gulp.dest('lib'))
})
