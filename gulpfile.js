'use strict';
const gulp = require('gulp');
const less = require('gulp-less');
const browserify = require('gulp-browserify');
const uglify = require('gulp-uglify');
const minifyCss = require('gulp-minify-css');
const concatCss = require('gulp-concat-css');
const del = require('del');
const runSequence = require('run-sequence');


const paths = {
    allLess: 'webapp/app/less/**/*.less',
    appLess: 'webapp/app/less/app.less',
    appJs: 'webapp/app/app.js',
    allJs: 'webapp/app/controllers/*.js',
    jquery: './node_modules/jquery/dist/jquery.js',
    bootstrap: './node_modules/bootstrap/dist/js/bootstrap.js',
    bootstrapLess: './node_modules/bootstrap/less/bootstrap.less',
    builtJs: 'webapp/public/app.js',
    builtCss: 'webapp/public/app.css'
};

gulp.task('clean', function() {
    return del([paths.builtJs, paths.builtCss]);
});

// runs browserify on app.js and minifies js
gulp.task('scripts', function() {
     return gulp.src(paths.appJs)
        .pipe(browserify({
            insertGlobals : true
        }))
        .pipe(uglify())
        .pipe(gulp.dest('./webapp/public'));
});

// Compiles LESS > CSS and minifies CSS
gulp.task('less', function(){
    return gulp.src([paths.appLess, paths.bootstrapLess])
        .pipe(less())
        .pipe(concatCss('app.css'))
        .pipe(minifyCss())
        .pipe(gulp.dest('./webapp/public'));
});

// Watches files for changes, runs appropriate task
gulp.task('watch', function(){
    gulp.watch(paths.allLess, ['less']);
    gulp.watch(paths.appLess, ['less']);
    gulp.watch(paths.appJs, ['scripts']);
    gulp.watch(paths.allJs, ['scripts']);
});


gulp.task('default', function() {
    runSequence('clean',
        ['less', 'scripts']);
});