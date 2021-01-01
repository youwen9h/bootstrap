#!/usr/bin/env node

'use strict'

const fs = require('fs/promises')
const path = require('path')
const postcss = require('postcss')
const glob = require('glob')
const sass = require('sass')
const autoprefixer = require('autoprefixer')
const Cleancss = require('clean-css')

const postcssPlugins = [
  autoprefixer({ cascade: false })
]

const FILES = [
  'bootstrap',
  'bootstrap-grid',
  'bootstrap-reboot',
  'bootstrap-utilities'
]

async function processFile(filename) {
  const sassOptions = {
    file: path.resolve(`./scss/${filename}.scss`),
    outputStyle: 'expanded',
    sourceMap: true,
    sourceMapContents: true,
    outFile: `./dist/css/${filename}.css`
  }

  const css = await sass.renderSync(sassOptions)

  // Fix postcss to use and output sourcemaps
  const processedCss = await postcss(postcssPlugins)
    .process(css.css, {
      from: `./dist/css/${filename}.css`,
      map: `./dist/css/${filename}.css.map`
    })

  const minifiedCss = await new Cleancss().minify(processedCss.css).styles

  await fs.writeFile(`./dist/css/${filename}.css`, processedCss.css)
  await fs.writeFile(`./dist/css/${filename}.css.map`, processedCss.map.toString())
  await fs.writeFile(`./dist/css/${filename}.min.css`, minifiedCss)
}

(async () => {
  try {
    await Promise.all(FILES.map(file => processFile(file)))
  } catch (error) {
    console.error(error)
    process.exit(1)
  }
})()

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
