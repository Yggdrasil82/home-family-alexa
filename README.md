# Ma famille — skill Alexa pour Home Family

« Alexa, demande à **ma famille** d'ajouter du lait et des œufs. »

Les articles arrivent dans la liste de courses de l'appli Home Family (marqués « Alexa »).
Un article déjà sur la liste (pas encore acheté) n'est pas ajouté deux fois.

Ce dépôt ne contient **aucune clé ni donnée**. La clé Firebase se colle uniquement dans
la console Alexa (fichier `lambda/cle.json`), qui reste privée.

## Installation (console Alexa)

1. developer.amazon.com → Console Alexa → **Créer une skill**.
2. Nom : `Ma famille` · Langue : **Français (FR)** · Type : **Personnalisé** ·
   Hébergement : **Hébergé par Alexa (Node.js)**, région **UE (Irlande)**.
3. Modèle : **Importer une skill** → coller l'adresse de ce dépôt (se termine par `.git`).
4. Onglet **Code** → ouvrir `lambda/cle.json` → remplacer tout le contenu par la clé Firebase → **Enregistrer** → **Déployer**.
5. Onglet **Créer** → **Générer le modèle** (si ce n'est pas déjà fait).
6. Onglet **Test** → choisir **Développement**.

La skill marche alors sur toutes les enceintes du même compte Amazon.

## Phrases comprises

- « Alexa, demande à ma famille de noter du lait » (conseillé : « ajouter » est parfois pris par la liste d'Alexa)
- « Alexa, dis à ma famille qu'il n'y a plus de beurre »
- « Alexa, demande à ma famille d'ajouter du lait »
- « Alexa, demande à ma famille de mettre du pain, du beurre et six œufs »
- « Alexa, ouvre ma famille » puis « ajoute des tomates »
