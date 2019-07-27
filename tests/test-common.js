/*!
 * Copyright (c) 2014-2018 Digital Bazaar, Inc. All rights reserved.
 */
'use strict';

module.exports = async function({Secp256k1KeyPair}) {

  describe('secp256k1-key-pair', () => {
    it('properly signs and verifies', async () => {
      const x = await Secp256k1KeyPair.generate();
      const {sign} = x.signer();
      sign.should.be.a('function');
      const testBuffer = Buffer.from('test 1');
      const signature = await sign({data: testBuffer});
      (signature instanceof Uint8Array).should.be.true;
      const {verify} = x.verifier();
      verify.should.be.a('function');
      const result = await verify({data: testBuffer, signature});
      result.should.be.a('boolean');
      result.should.be.true;
    });
  });

};
