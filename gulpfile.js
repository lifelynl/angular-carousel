var gulp = require('gulp');
var cleanCSS = require('gulp-clean-css');
var uglify = require('gulp-uglify');
var del = require('del');
var rename = require('gulp-rename');

gulp.task('clean', function(){
    del(['angular-carousel.min.js', 'angular-carousel.min.css']);
});

gulp.task('minify-css', function() {
    gulp
        .src('angular-carousel.css')
        .pipe(cleanCSS({
            keepSpecialComments: '*'
        }))
        .pipe(rename({suffix: '.min'}))
        .pipe(gulp.dest('.'));
});

gulp.task('minify-js', function() {
    gulp
        .src('angular-carousel.js')
        .pipe(uglify({
            preserveComments: 'license'
        }))
        .pipe(rename({suffix: '.min'}))
        .pipe(gulp.dest('.'));
});

gulp.task('minify', ['minify-js', 'minify-css']);