import gulp from 'gulp'
import babel from 'gulp-babel'
import del from 'del'

gulp.task('clean-build', function() {
  return del(['lib'])
})

gulp.task('build', ['clean-build'], function () {
  return gulp.src('es6/**/*.js')
    .pipe(babel())
    .pipe(gulp.dest('lib'))
})
