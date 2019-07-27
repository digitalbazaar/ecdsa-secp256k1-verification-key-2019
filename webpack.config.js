/**
 * secp256k1-key-pair webpack build rules.
 *
 * @author Digital Bazaar, Inc.
 *
 * Copyright 2010-2019 Digital Bazaar, Inc.
 */
const path = require('path');
const webpackMerge = require('webpack-merge');

// build multiple outputs
module.exports = [];

// custom setup for each output
// all built files will export the
// "secp256k1-key-pairs" library but with
// different content
const outputs = [
  // core secp256k1-key-pairs library
  {
    entry: [
      // '@babel/polyfill' is very large, list features explicitly
      'core-js/fn/object/assign',
      'core-js/fn/promise',
      // main lib
      './lib/index.js'
    ],
    filenameBase: 'secp256k1-key-pair'
  },
  /*
  // core jsonld library + extra utils and networking support
  {
    entry: ['./lib/index.all.js'],
    filenameBase: 'jsonld.all'
  }
  */
  // custom builds can be created by specifying the high level files you need
  // webpack will pull in dependencies as needed
  // Note: if using UMD or similar, add jsonld.js *last* to properly export
  // the top level jsonld namespace.
  //{
  //  entry: ['./lib/FOO.js', ..., './lib/jsonld.js'],
  //  filenameBase: 'jsonld.custom'
  //  libraryTarget: 'umd'
  //}
];

const include = new RegExp('node_modules\/jsonld-signatures\/lib' +
  + '\/suites\/LinkedDataSignature2015');

outputs.forEach(info => {
  // common to bundle and minified
  const common = {
    // each output uses the "jsonld" name but with different contents
    entry: {
      'secp256k1-key-pair': info.entry
    },
    module: {
      rules: [
        {
          test: /\.js$/,
          include: [{
            // exclude node_modules by default
            exclude: /(node_modules)/,
            include
          }/*, {
            // include jsonld
            //include: /(node_modules\/jsonld)/
          }*/],
          use: {
            loader: 'babel-loader',
            options: {
              presets: ['@babel/preset-env'],
              plugins: [
                [
                  '@babel/plugin-proposal-object-rest-spread',
                  {useBuiltIns: true}
                ],
                '@babel/plugin-transform-modules-commonjs',
                '@babel/plugin-transform-runtime'
              ]
            }
          }
        }
      ]
    },
    // disable various node shims as jsonld handles this manually
    node: {
      Buffer: false,
      crypto: false,
      process: false,
      setImmediate: false
    },
    externals: {
      'node-forge': {
        amd: 'node-forge',
        commonjs: 'node-forge',
        commonjs2: 'node-forge',
        root: 'forge'
      },
    }
  };

  // plain unoptimized unminified bundle
  const bundle = webpackMerge(common, {
    mode: 'development',
    output: {
      path: path.join(__dirname, 'dist'),
      filename: info.filenameBase + '.js',
      library: info.library || '[name]',
      libraryTarget: info.libraryTarget || 'umd'
    }
  });
  if(info.library === null) {
    delete bundle.output.library;
  }
  if(info.libraryTarget === null) {
    delete bundle.output.libraryTarget;
  }

  // optimized and minified bundle
  const minify = webpackMerge(common, {
    mode: 'production',
    output: {
      path: path.join(__dirname, 'dist'),
      filename: info.filenameBase + '.min.js',
      library: info.library || '[name]',
      libraryTarget: info.libraryTarget || 'umd'
    },
    devtool: 'cheap-module-source-map',
  });
  if(info.library === null) {
    delete minify.output.library;
  }
  if(info.libraryTarget === null) {
    delete minify.output.libraryTarget;
  }

  module.exports.push(bundle);
  module.exports.push(minify);
});
