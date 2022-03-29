const jsonFiles = require('./project-file.js')
const gulp = require('gulp')
const csso = require('gulp-csso')
const htmlmin = require('gulp-htmlmin')
const gulpif = require('gulp-if')
const uglifyes = require('gulp-uglify-es').default
let isPro = jsonFiles.env === 'pro' ? true : false

gulp.task('html', (response) => {
  jsonFiles.html.forEach((item) => {
    gulp
      .src(item.path)
      .pipe(
        gulpif(
          isPro,
          htmlmin({
            removeComments: true,
            collapseWhitespace: true,
            removeEmptyAttributes: true,
            minifyJS: true,
            minifyCSS: true,
          }),
        ),
      )
      .pipe(gulp.dest(item.dir))
  })
  console.log('\x1B[32m Finished html success! \x1B[0m')
  response()
})

gulp.task('css', (response) => {
  jsonFiles.css.forEach((item) => {
    gulp.src(item.path).pipe(gulpif(isPro, csso())).pipe(gulp.dest(item.dir))
  })
  console.log('\x1B[32m Finished css success! \x1B[0m')
  response()
})

gulp.task('js', (response) => {
  jsonFiles.js.forEach((item) => {
    gulp
      .src(item.path)
      .pipe(gulpif(isPro, uglifyes()))
      .pipe(gulp.dest(item.dir))
  })
  console.log('\x1B[32m Finished js success! \x1B[0m')
  response()
})

gulp.task('other', (response) => {
  jsonFiles.other.forEach((item) => {
    gulp.src(item.path).pipe(gulp.dest(item.dir))
  })
  console.log('\x1B[32m Finished other success! \x1B[0m')
  response()
})

gulp.task('build', gulp.parallel('html', 'css', 'js', 'other'))
