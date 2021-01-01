#!/usr/bin/env node

'use strict'

const fs = require('fs')
const path = require('path')
const postcss = require('postcss')
const glob = require('glob')
const sass = require('sass')
const autoprefixer = require('autoprefixer')
const fiber = require('fibers')
const Cleancss = require('clean-css')

const postcssPlugins = [
  autoprefixer({ cascade: false })
]

const files = [
  'bootstrap',
  'bootstrap-grid',
  'bootstrap-reboot',
  'bootstrap-utilities'
]

files.forEach(filename => {
  sass.render({
    file: path.resolve(`./scss/${filename}.scss`),
    fiber,
    outputStyle: 'expanded',
    sourceMap: true,
    sourceMapContents: true,
    outFile: `./dist/css/${filename}.css`
  }, (error, css) => {
    // Fix postcss to use and output sourcemaps
    postcss(postcssPlugins)
      .process(css.css, {
        from: `./dist/css/${filename}.css`,
        map: `./dist/css/${filename}.css.map`
      })
      .then(result => {
        fs.writeFile(`./dist/css/${filename}.css`, result.css, () => true)
        fs.writeFile(`./dist/css/${filename}.css.map`, result.map.toString(), () => true)
        fs.writeFile(`./dist/css/${filename}.min.css`, new Cleancss().minify(result.css).styles, () => true)
      })
  })
})

// Prefix examples
glob('./site/content/**/*.css', {}, (error, files) => {
  files.forEach(file => {
    fs.readFile(file, (err, css) => {
      postcss(postcssPlugins)
        .process(css, { from: file, to: file })
        .then(result => {
          if (css.toString('utf8') !== result.css) {
            fs.writeFile(file, result.css, () => true)
          }
        })
    })
  })
})
