const { src, dest, series, parallel } = require('gulp');
const del = require('del');
const fs = require('fs');
const zip = require('gulp-zip');
const log = require('fancy-log');
const webpack_stream = require('webpack-stream');
const webpack_config = require('./webpack.config.js');
var exec = require('child_process').exec;

const paths = {
    prod_build: 'prod-build',
    server_file_name: 'server.bundle.js',
    angular_src: 'app/dist/**/*',
    angular_dist: 'prod-build/app/dist',
    zipped_file_name: 'angular-nodejs.zip',
    tracery_src: 'data/*',
    tracery_dist: 'prod-build/data',
    email_json: 'email.json',
    couchDb_json: 'couchDB.json',
};

function clean() {
    log('removing the old files in the directory')
    return del('prod-build/**', { force: true });
}

function createProdBuildFolder() {

    const dir = paths.prod_build;
    log(`Creating the folder if not exist  ${dir}`)
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
        log('📁  folder created:', dir);
    }

    return Promise.resolve('the value is ignored');
}

function buildAngularCodeTask(cb) {
    log('building Angular code into the directory')
    return exec('cd app && npm run build-prod', function (err, stdout, stderr) {
        log(stdout);
        log(stderr);
        cb(err);
    })
}

function copyAngularCodeTask() {
    log('copying Angular code into the directory')
    return src(`${paths.angular_src}`)
        .pipe(dest(`${paths.angular_dist}`));
}

function copyNodeJSCodeTask() {
    log('building and copying server code into the directory')
    return webpack_stream(webpack_config)
        .pipe(dest(`${paths.prod_build}`))
}

function copyDataCodeTask() {
    log('copying tracery data into the directory')
    return src(`${paths.tracery_src}`)
        .pipe(dest(`${paths.tracery_dist}`));
}

function copyEmailConfig() {
    log('copying email config')
    return src(`${paths.email_json}`)
        .pipe(dest(`${paths.prod_build}`));
}

function copyCouchDbConfig() {
    log('copying couchDb config')
    return src(`${paths.couchDb_json}`)
        .pipe(dest(`${paths.prod_build}`));
}

function zippingTask() {
    log('zipping the code ')
    return src(`${paths.prod_build}/**`)
        .pipe(zip(`${paths.zipped_file_name}`))
        .pipe(dest(`${paths.prod_build}`))
}


exports.default = series(
    clean,
    createProdBuildFolder,
    buildAngularCodeTask,
    parallel(copyAngularCodeTask, copyNodeJSCodeTask, copyDataCodeTask, copyEmailConfig, copyCouchDbConfig),
    // zippingTask
);
