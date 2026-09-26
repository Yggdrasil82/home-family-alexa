const assert = require('assert');
const crypto = require('crypto');
const { jwt } = require('../lambda/firestore');

// Le jeton est bien signé avec la clé du compte de service.
const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
const cle = { client_email: 'alexa@projet.iam.gserviceaccount.com', private_key: privateKey.export({ type: 'pkcs8', format: 'pem' }) };
const [entete, contenu, signature] = jwt(cle, 1000).split('.');
const valide = crypto.createVerify('RSA-SHA256').update(`${entete}.${contenu}`)
  .verify(publicKey, Buffer.from(signature.replace(/-/g, '+').replace(/_/g, '/'), 'base64'));
assert.ok(valide);
const charge = JSON.parse(Buffer.from(contenu.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString());
assert.strictEqual(charge.iss, cle.client_email);
assert.strictEqual(charge.exp, 4600);
console.log('ok firestore');
