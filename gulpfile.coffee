#
# External dependencies
#
gulp =        require('gulp')
uglify =      require('gulp-uglify')
jasmine =     require('gulp-jasmine')
runSequence = require('run-sequence')
rename      = require('gulp-rename')
browserify  = require('browserify')
coffeelint  = require('gulp-coffeelint')
coffeeify   = require('coffeeify')
uglifyify   = require('uglifyify')
source      = require 'vinyl-source-stream'

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
gulp.task('js', ->
  browserify(
    {
      entries: './src/mycshash.coffee'
      extensions: [ '.coffee' ]
      transform: [ 'coffeeify' ]
      expose: 'mycshash'
    }
  )
  .bundle().pipe(source('mycshash.js')).pipe(gulp.dest('./build'))
)

#
# Minification task)
#
gulp.task('minify', ->
  gulp
    .src('./build/*.js')
    .pipe(uglify(UGLIFY_OPTIONS))
    .pipe(gulp.dest('build/min'))
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
# Copy to final destination (for node require to work)
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
    'js'             # for client side distribution
    'minify'         # for client side distribution
    'copy'           # for server side distribution
    process.exit
  )
)
