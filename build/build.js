const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const uglify = require('uglify-js');
const rollup = require('rollup');
const buble = require('rollup-plugin-buble');
const flow = require('rollup-plugin-flow-no-whitespace');
const cjs = require('rollup-plugin-commonjs');
const node = require('rollup-plugin-node-resolve');
const replace = require('rollup-plugin-replace');
const version = process.env.VERSION || require('../package.json').version;
const banner =
`/**
  * Leafkit - Ferramentas Vue para UI
  * 
  * leafkit-mask v${version}
  * @license MIT
  * (c) ${new Date().getFullYear()} hvpaiva
  */`;

if (!fs.existsSync('dist')) {
  fs.mkdirSync('dist')
}

const resolve = _path => path.resolve(__dirname, '../', _path);

build([
  {
    dest: resolve('dist/leafkit-mask.js'),
    format: 'umd',
    env: 'development'
  },
  {
    dest: resolve('dist/leafkit-mask.min.js'),
    format: 'umd',
    env: 'production'
  },
  {
    dest: resolve('dist/leafkit-mask.common.js'),
    format: 'cjs'
  },
  {
    dest: resolve('dist/leafkit-mask.esm.js'),
    format: 'es'
  }
].map(genConfig));

function build(builds) {
  let built = 0;
  const total = builds.length;
  const next = () => {
    buildEntry(builds[built]).then(() => {
      built++;
      if (built < total) {
        next()
      }
    }).catch(logError)
  };

  next()
}

function genConfig(opts) {
  const config = {
    entry: resolve('src/index.js'),
    dest: opts.dest,
    format: opts.format,
    banner,
    moduleName: 'LeafkitMask',
    plugins: [
      flow(),
      node(),
      cjs(),
      replace({
        __VERSION__: version
      }),
      buble()
    ]
  };

  if (opts.env) {
    config.plugins.unshift(replace({
      'process.env.NODE_ENV': JSON.stringify(opts.env)
    }))
  }

  return config
}

function buildEntry(config) {
  const isProd = /min\.js$/.test(config.dest);
  return rollup.rollup(config).then(bundle => {
    const code = bundle.generate(config).code;
    if (isProd) {
      let minified = (config.banner ? config.banner + '\n' : '') + uglify.minify(code, {
        fromString: true,
        output: {
          screw_ie8: true,
          ascii_only: true
        },
        compress: {
          pure_funcs: ['makeMap']
        }
      }).code;
      return write(config.dest, minified, true)
    } else {
      return write(config.dest, code)
    }
  })
}

function write(dest, code, zip) {
  return new Promise((resolve, reject) => {
    function report (extra) {
      console.log(blue(path.relative(process.cwd(), dest)) + ' ' + getSize(code) + (extra || ''));
      resolve()
    }

    fs.writeFile(dest, code, err => {
      if (err) return reject(err);
      if (zip) {
        zlib.gzip(code, (err, zipped) => {
          if (err) return reject(err);
          report(' (gzipped: ' + getSize(zipped) + ')')
        })
      } else {
        report()
      }
    })
  })
}

function getSize(code) {
  return (code.length / 1024).toFixed(2) + 'kb'
}

function logError(e) {
  console.log(e)
}

function blue(str) {
  return '\x1b[1m\x1b[34m' + str + '\x1b[39m\x1b[22m'
}