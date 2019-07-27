/*!
 * Copyright (c) 2019 Digital Bazaar, Inc. All rights reserved.
 */
'use strict';

const crypto = require('crypto');
const forge = require('node-forge');
const {util: {binary: {base58}}} = forge;
const ec = new require('elliptic').ec('secp256k1');
const util = require('./util');

class Secp256KeyPair {
  /**
   * @param {KeyPairOptions} options - The options to use.
   * @param {string} options.id - The key ID.
   * @param {string} options.controller - The key controller.
   * @param {string} options.publicKeyBase58 - The Base58 encoded Public Key.
   * @param {string} options.privateKeyBase58 - The Base58 Private Key.
   */
  constructor(options = {}) {
    this.id = options.id;
    this.controller = options.controller;
    this.type = 'EcdsaSecp256k1VerificationKey2019';
    this.privateKeyBase58 = options.privateKeyBase58;
    this.publicKeyBase58 = options.publicKeyBase58;
  }

  /**
   * Returns the Base58 encoded public key.
   *
   * @returns {string} The Base58 encoded public key.
   */
  get publicKey() {
    return this.publicKeyBase58;
  }

  /**
   * Returns the Base58 encoded private key.
   *
   * @returns {string} The Base58 encoded private key.
   */
  get privateKey() {
    return this.privateKeyBase58;
  }

  /**
   * Generates a KeyPair with an optional deterministic seed.
   * @param {KeyPairOptions} [options={}] - The options to use.
   *
   * @returns {Promise<Secp256KeyPair>} Generates a key pair.
   */
  static async generate(options = {}) {
    const key = ec.genKeyPair();
    const pubPoint = key.getPublic();
    // encode public X and Y in compressed form
    const publicKeyBase58 = base58.encode(new Uint8Array(
      pubPoint.encodeCompressed()));
    const privateKeyBase58 = base58.encode(new Uint8Array(
      key.getPrivate().toArray()));
    return new Secp256KeyPair({
      privateKeyBase58,
      publicKeyBase58,
      ...options
    });
  }

  /**
   * Returns a signer object for use with jsonld-signatures.
   *
   * @returns {{sign: Function}} A signer for the json-ld block.
   */
  signer() {
    return secp256SignerFactory(this);
  }

  /**
   * Returns a verifier object for use with jsonld-signatures.
   *
   * @returns {{verify: Function}} Used to verify jsonld-signatures.
   */
  verifier() {
    return secp256VerifierFactory(this);
  }

  /**
   * Adds a public key base to a public key node.
   *
   * @param {Object} publicKeyNode - The public key node in a jsonld-signature.
   * @param {string} publicKeyNode.publicKeyBase58 - Base58 Public Key for
   *   jsonld-signatures.
   *
   * @returns {Object} A PublicKeyNode in a block.
   */
  addEncodedPublicKey(publicKeyNode) {
    publicKeyNode.publicKeyBase58 = this.publicKeyBase58;
    return publicKeyNode;
  }

  /**
   * Generates and returns a public key fingerprint.
   *
   * @param {string} publicKeyBase58 - The base58 encoded public key material.
   *
   * @returns {string} The fingerprint.
   */
  static fingerprintFromPublicKey(/*{publicKeyBase58}*/) {
    // TODO: implement
    throw new Error('`fingerprintFromPublicKey` API is not implemented.');
  }

  /**
   * Generates and returns a public key fingerprint.
   *
   * @returns {string} The fingerprint.
   */
  fingerprint() {
    // TODO: implement
    throw new Error('`fingerprint` API is not implemented.');
  }

  /**
   * Tests whether the fingerprint was generated from a given key pair.
   *
   * @param {string} fingerprint - A Base58 public key.
   *
   * @returns {Object} An object indicating valid is true or false.
   */
  verifyFingerprint(/*fingerprint*/) {
    // TODO: implement
    throw new Error('`verifyFingerprint` API is not implemented.');
  }

  static async from(options) {
    return new Secp256KeyPair(options);
  }

  /**
   * Contains the public key for the KeyPair
   * and other information that json-ld Signatures can use to form a proof.
   * @param {Object} [options={}] - Needs either a controller or owner.
   * @param {string} [options.controller=this.controller]  - DID of the
   * person/entity controlling this key pair.
   *
   * @returns {Object} A public node with
   * information used in verification methods by signatures.
   */
  publicNode({controller = this.controller} = {}) {
    const publicNode = {
      id: this.id,
      type: this.type,
    };
    if(controller) {
      publicNode.controller = controller;
    }
    this.addEncodedPublicKey(publicNode); // Subclass-specific
    return publicNode;
  }
}

/**
 * @ignore
 * Returns an object with an async sign function.
 * The sign function is bound to the KeyPair
 * and then returned by the KeyPair's signer method.
 * @param {Secp256KeyPair} key - An Secp256KeyPair.
 *
 * @returns {{sign: Function}} An object with an async function sign
 * using the private key passed in.
 */
function secp256SignerFactory(key) {
  if(!key.privateKeyBase58) {
    return {
      async sign() {
        throw new Error('No private key to sign with.');
      }
    };
  }

  const privateKey = util.base58Decode({
    decode: base58.decode,
    keyMaterial: key.privateKeyBase58,
    type: 'private'
  });
  const k = ec.keyPair({
    priv: privateKey.toString('hex'),
    privEnc: 'hex'
  });
  return {
    async sign({data}) {
      const md = crypto.createHash('sha256').update(data).digest();
      return new Uint8Array(k.sign(md).toDER());
    }
  };
}

/**
 * @ignore
 * Returns an object with an async verify function.
 * The verify function is bound to the KeyPair
 * and then returned by the KeyPair's verifier method.
 * @param {Secp256KeyPair} key - An Secp256KeyPair.
 *
 * @returns {{verify: Function}} An async verifier specific
 * to the key passed in.
 */
function secp256VerifierFactory(key) {
  const publicKey = util.base58Decode({
    decode: base58.decode,
    keyMaterial: key.publicKeyBase58,
    type: 'public'
  });
  const k = ec.keyPair({
    pub: publicKey.toString('hex'),
    pubEnc: 'hex'
  });
  return {
    async verify({data, signature}) {
      const md = crypto.createHash('sha256').update(data).digest();
      let verified = false;
      try {
        verified = k.verify(md, signature);
      } catch(e) {
        console.error('An error occurred when verifying signature: ', e);
      }
      return verified;
    }
  };
}

module.exports = Secp256KeyPair;
