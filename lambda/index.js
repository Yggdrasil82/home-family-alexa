'use strict';

// Skill Alexa « Ma famille » : ajoute des articles à la liste de courses de Home Family.
// « Alexa, demande à ma famille d'ajouter du lait et des œufs. »

const Alexa = require('ask-sdk-core');
const { decouper, cle, phrase } = require('./articles');
const firestore = require('./firestore');

// Clé Firebase collée dans cle.json depuis la console Alexa (jamais publiée sur GitHub).
let configuration = {};
try {
  configuration = require('./cle.json');
} catch (e) {
  configuration = {};
}

const PAS_CONFIGUREE = "La skill n'est pas encore reliée à Home Family. Colle la clé Firebase dans le fichier cle.json, puis déploie.";
const EXEMPLE = 'Dis par exemple : ajoute du lait et du pain.';

const Lancement = {
  canHandle(input) {
    return Alexa.getRequestType(input.requestEnvelope) === 'LaunchRequest';
  },
  handle(input) {
    return input.responseBuilder
      .speak('Que faut-il ajouter aux courses ? ' + EXEMPLE)
      .reprompt(EXEMPLE)
      .getResponse();
  },
};

const AjouterCourses = {
  canHandle(input) {
    return Alexa.getRequestType(input.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(input.requestEnvelope) === 'AjouterCoursesIntent';
  },
  async handle(input) {
    const articles = decouper(Alexa.getSlotValue(input.requestEnvelope, 'articles'));
    if (articles.length === 0) {
      return input.responseBuilder.speak("Je n'ai pas compris. " + EXEMPLE).reprompt(EXEMPLE).getResponse();
    }
    if (!configuration.private_key) return input.responseBuilder.speak(PAS_CONFIGUREE).getResponse();

    // Ce qui est déjà sur la liste (pas encore acheté) n'est pas ajouté une deuxième fois.
    const enCours = await firestore.articlesEnCours(configuration);
    const deja = new Set(enCours.map(cle));
    const nouveaux = articles.filter((a) => !deja.has(cle(a)));
    const presents = articles.filter((a) => deja.has(cle(a)));

    if (nouveaux.length > 0) await firestore.ajouter(configuration, nouveaux);

    let reponse = nouveaux.length > 0 ? `C'est noté : ${phrase(nouveaux)}.` : '';
    if (presents.length > 0) {
      reponse += ` ${phrase(presents)} ${presents.length > 1 ? 'étaient' : 'était'} déjà sur la liste.`;
    }
    return input.responseBuilder.speak(reponse.trim()).withShouldEndSession(true).getResponse();
  },
};

const Aide = {
  canHandle(input) {
    return Alexa.getRequestType(input.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(input.requestEnvelope) === 'AMAZON.HelpIntent';
  },
  handle(input) {
    return input.responseBuilder
      .speak("J'ajoute des articles à la liste de courses de Home Family. " + EXEMPLE)
      .reprompt(EXEMPLE)
      .getResponse();
  },
};

const Arreter = {
  canHandle(input) {
    return Alexa.getRequestType(input.requestEnvelope) === 'IntentRequest'
      && ['AMAZON.CancelIntent', 'AMAZON.StopIntent', 'AMAZON.NavigateHomeIntent'].includes(Alexa.getIntentName(input.requestEnvelope));
  },
  handle(input) {
    return input.responseBuilder.speak('À bientôt !').withShouldEndSession(true).getResponse();
  },
};

const Incompris = {
  canHandle(input) {
    return Alexa.getRequestType(input.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(input.requestEnvelope) === 'AMAZON.FallbackIntent';
  },
  handle(input) {
    return input.responseBuilder.speak("Je n'ai pas compris. " + EXEMPLE).reprompt(EXEMPLE).getResponse();
  },
};

const FinDeSession = {
  canHandle(input) {
    return Alexa.getRequestType(input.requestEnvelope) === 'SessionEndedRequest';
  },
  handle(input) {
    return input.responseBuilder.getResponse();
  },
};

const Erreur = {
  canHandle() {
    return true;
  },
  handle(input, error) {
    console.log('Erreur :', error);
    return input.responseBuilder
      .speak("Désolé, je n'ai pas réussi à joindre la liste de courses. Réessaie dans un instant.")
      .getResponse();
  },
};

exports.handler = Alexa.SkillBuilders.custom()
  .addRequestHandlers(Lancement, AjouterCourses, Aide, Arreter, Incompris, FinDeSession)
  .addErrorHandlers(Erreur)
  .lambda();
