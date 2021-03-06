
const { createBundleRenderer } = require('vue-server-renderer')
const { resolve } = require('path') 
const { readFileSync } = require('mz/fs')
const template = require('lodash.template')
const LRU = require('lru-cache')
const assert = require('assert')
const Vue = require('vue')
const htmlescape = require('htmlescape')

global.Vue = Vue

const assign = Object.assign

module.exports = function vueView(opts = {}) {
  let {
    ext = 'vue',
    layout,
    root
  } = opts

  assert.ok(typeof root === 'string', 'root is required')

  root = resolve(root)

  // bundle render options
  const bundleOptions = assign({}, {
    ext: '.json',
    cache: true,
    root
  }, opts.bundleOptions)

  bundleOptions.ext = bundleOptions.ext.replace(/^\./, '')
  ext = ext.replace(/^\./, '')

  bundleOptions.root = resolve(bundleOptions.root)

  if (layout) {
    layout = readFileSync(resolve(root, layout), 'utf-8')
  }
  layout = template(layout || '${ content }')

  return async function(ctx, next) {
    if (ctx.render) {
      return await next()
    }

    ctx.render = createBundleRender(bundleOptions, ctx, layout)

    return await next()
  }
}

/**
 * private
 */

function createBundleRender(options, ctx, layout) {
  const {
    cache,
    root,
    ext
  } = options

  return async function bundleRender(filename, data, pipe = context => context) {
    filename = filename + '.' + ext
    filename = resolve(root, filename)
    const r = createBundleRenderer(filename, {
      cache: cache ? LRU({
        max: 10000
      }) : false
    })

    let context = {
      path: ctx.path,
      data
    }
    return new Promise((resolve, reject) => {
      try {
        r.renderToString(context, (err, html) => {
          if (err) {
            reject(err)
          } else {
            context = assign({}, data, context) 
            context = pipe(context) || context
            html = layout(assign({}, context, {
              _vue_ssr_html: html,
              _vue_ssr_data: data,
              _vue_ssr_data_json_str: htmlescape(data)
            }))
  
            ctx.body = html
            resolve(html)
          }
        })
      } catch (e) {
        resolve(e)
      }
    })
  }
}
