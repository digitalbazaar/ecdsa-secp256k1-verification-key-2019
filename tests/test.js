/**
 * Copyright (c) 2019 Digital Bazaar, Inc. All rights reserved.
 */
'use strict';

const chai = require('chai');
const common = require('./test-common');
const jsigs = require('jsonld-signatures');
const constants = require('jsonld-signatures/lib/constants');
const Secp256k1KeyPair = require('..');
const util = require('jsonld-signatures/lib/util');
const should = chai.should();

const options = {
  constants,
  jsigs,
  Secp256k1KeyPair,
  should,
  util,
  nodejs: true
};

common(options).then(() => {
  run();
}).catch(err => {
  console.error(err);
});

process.on('unhandledRejection', (reason, p) => {
  console.error('Unhandled Rejection at:', p, 'reason:', reason);
});
