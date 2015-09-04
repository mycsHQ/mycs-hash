#
# External dependencies
#
gulp =        require('gulp')
uglify =      require('gulp-uglify')
jasmine =     require('gulp-jasmine')
runSequence = require('run-sequence')
rename      = require('gulp-rename')
browserify =  require('gulp-browserify')
coffeelint =  require('gulp-coffeelint')

COFFEE_SRC = 'src/**/*.coffee'
UGLIFY_OPTIONS = {
  mangle: true
  compress: {
    drop_console: true
    booleans: true
    loops: true
    warnings: false
  }
}


##################################
#
# Tasks
#
##################################

gulp.task('coffeelint', ->
    gulp
      .src(COFFEE_SRC)
      .pipe(coffeelint())
      .pipe(coffeelint.reporter())
)

#
# Browserify
#
gulp.task('browserify', ->
  gulp.src('./src/mycshash.coffee', { read: false })
    .pipe(browserify({ transform: ['coffeeify'], extensions: ['.coffee'], debug : false }))
    .pipe(rename('mycshash.js'))
    .pipe(gulp.dest('./build'))
)

#
# Jasmine unit tests
#
gulp.task('jasmine:unit', ->
  gulp
    .src([COFFEE_SRC])
    .pipe(jasmine())
    .on('error', process.exit.bind(process, 1))
)

#
# Minify file
#
gulp.task('minify', ->
  gulp
    .src("build/mycshash.js")
    .pipe(uglify(UGLIFY_OPTIONS))
    .pipe(gulp.dest("build/min/"))
)


#
# Run unit tests
#
gulp.task('test', ->
  runSequence(
    'coffeelint',
    'jasmine:unit'
    process.exit
  )
)

#
# Copy to final destination (for node)
#
gulp.task('copy', ->
  gulp.src('src/**/!(*.spec)*.coffee', {}).pipe(gulp.dest('lib/'))
)

#
# Main task : run the test and produce the distribution
#
gulp.task('default', ->
  runSequence(
    'coffeelint'
    'jasmine:unit'
    'browserify'
    'minify'
    'copy'
    process.exit
  )
)
