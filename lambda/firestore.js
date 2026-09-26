'use strict';

// Accès à la liste de courses Home Family (Firestore) par l'API web de Google, sans
// bibliothèque lourde : un jeton est signé avec la clé du compte de service (cle.json).

const crypto = require('crypto');
const https = require('https');

function base64url(texte) {
  return Buffer.from(texte).toString('base64').replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function requete(url, options, corps) {
  return new Promise((resoudre, rejeter) => {
    const req = https.request(url, options, (res) => {
      let donnees = '';
      res.on('data', (morceau) => { donnees += morceau; });
      res.on('end', () => {
        if (res.statusCode >= 400) {
          rejeter(new Error(`HTTP ${res.statusCode} : ${donnees.slice(0, 300)}`));
          return;
        }
        try {
          resoudre(donnees ? JSON.parse(donnees) : {});
        } catch (e) {
          rejeter(e);
        }
      });
    });
    req.on('error', rejeter);
    req.setTimeout(6000, () => req.destroy(new Error('Délai dépassé')));
    if (corps) req.write(corps);
    req.end();
  });
}

/** Jeton d'accès signé avec la clé (valable une heure, gardé en mémoire). */
let jeton = null;
function jwt(cle, maintenant) {
  const entete = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const contenu = base64url(JSON.stringify({
    iss: cle.client_email,
    scope: 'https://www.googleapis.com/auth/datastore',
    aud: 'https://oauth2.googleapis.com/token',
    iat: maintenant,
    exp: maintenant + 3600,
  }));
  const signature = crypto.createSign('RSA-SHA256').update(`${entete}.${contenu}`).sign(cle.private_key, 'base64')
    .replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
  return `${entete}.${contenu}.${signature}`;
}

async function acces(cle) {
  const maintenant = Math.floor(Date.now() / 1000);
  if (jeton && jeton.expire > maintenant + 60) return jeton.valeur;
  const corps = new URLSearchParams({
    grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
    assertion: jwt(cle, maintenant),
  }).toString();
  const reponse = await requete('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(corps) },
  }, corps);
  jeton = { valeur: reponse.access_token, expire: maintenant + (reponse.expires_in || 3600) };
  return jeton.valeur;
}

function racine(cle) {
  return `projects/${cle.project_id}/databases/(default)/documents`;
}

async function appel(cle, chemin, objet) {
  const corps = JSON.stringify(objet);
  return requete(`https://firestore.googleapis.com/v1/${racine(cle)}:${chemin}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${await acces(cle)}`,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(corps),
    },
  }, corps);
}

/** Textes des articles pas encore achetés. */
async function articlesEnCours(cle) {
  const reponse = await appel(cle, 'runQuery', {
    structuredQuery: {
      from: [{ collectionId: 'courses' }],
      where: { fieldFilter: { field: { fieldPath: 'done' }, op: 'EQUAL', value: { booleanValue: false } } },
    },
  });
  return (Array.isArray(reponse) ? reponse : [])
    .map((r) => r.document && r.document.fields && r.document.fields.text && r.document.fields.text.stringValue)
    .filter(Boolean);
}

/** Identifiant de document au hasard (20 caractères, comme Firestore). */
function identifiant() {
  const lettres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from(crypto.randomBytes(20), (o) => lettres[o % lettres.length]).join('');
}

/** Ajoute les articles, marqués « alexa », en une seule écriture. */
async function ajouter(cle, textes) {
  await appel(cle, 'commit', {
    writes: textes.map((texte) => ({
      update: {
        name: `${racine(cle)}/courses/${identifiant()}`,
        fields: {
          text: { stringValue: texte },
          done: { booleanValue: false },
          addedBy: { stringValue: 'alexa' },
        },
      },
      currentDocument: { exists: false },
      updateTransforms: [{ fieldPath: 'createdAt', setToServerValue: 'REQUEST_TIME' }],
    })),
  });
}

module.exports = { articlesEnCours, ajouter, jwt };
