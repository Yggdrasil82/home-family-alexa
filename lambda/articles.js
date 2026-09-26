'use strict';

// Découpe ce qui a été dit en articles : « du lait, du pain et six œufs » → Lait, Pain, 6 œufs.
// Même logique que la dictée de l'appli Home Family.

const SEPARATEURS = /\s*(?:,|;|\bvirgule\b|\bpuis\b|\bet aussi\b|\bet\b)\s*/i;
const DEBUT = /^(?:(?:qu'il (?:nous )?faut|il faut|il faudrait|qu'il n'y a plus de|il n'y a plus de|qu'on a besoin de|ajoute[rz]?|ajouter|d'ajouter|d’ajouter|rajoute[rz]?|mets|mettre|de mettre|note[rz]?|de noter|prends|de prendre)\s+)+/i;
const FIN = /\s+(?:(?:à|a|sur|dans) (?:la|ma) liste(?: de courses| des courses)?|aux courses|dans les courses)\s*$/i;
const PARTITIF = /^(?:du |de la |de l'|de l’|des |un peu de |un peu d'|un peu d’)/i;
const NOMBRES = {
  deux: 2, trois: 3, quatre: 4, cinq: 5, six: 6, sept: 7, huit: 8,
  neuf: 9, dix: 10, onze: 11, douze: 12, quinze: 15, vingt: 20,
};

function nettoyer(brut) {
  const article = brut.replace(PARTITIF, '') || brut;
  const premier = article.split(' ')[0];
  const nombre = NOMBRES[premier.toLowerCase()];
  const texte = nombre && article.length > premier.length ? nombre + article.slice(premier.length) : article;
  return texte.charAt(0).toUpperCase() + texte.slice(1);
}

function decouper(dit) {
  return (dit || '')
    .trim()
    .replace(DEBUT, '')
    .replace(FIN, '')
    .split(SEPARATEURS)
    .map((a) => a.trim().replace(/[.!?]+$/, '').trim())
    .filter((a) => a.length > 0)
    .map(nettoyer);
}

/** Clé de comparaison : minuscules, sans accents. */
function cle(texte) {
  return texte.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '').replace(/œ/g, 'oe').trim();
}

/** « lait, pain et 6 œufs » */
function phrase(articles) {
  const mots = articles.map((a) => a.toLowerCase());
  if (mots.length <= 1) return mots.join('');
  return mots.slice(0, -1).join(', ') + ' et ' + mots[mots.length - 1];
}

module.exports = { decouper, cle, phrase };
