# Tableaux de bord des marchés de prédiction (Hyperliquid, Polymarket)

Tableaux de bord **en lecture seule** des marchés de prédiction d'Hyperliquid (« outcomes »)
et de Polymarket : probabilités implicites, cotes équivalentes, variations sur 24 h, volumes,
argent engagé, historique des prix, carnet d'ordres et dernières transactions.

Ils n'utilisent que des API publiques : aucun wallet, aucune clé privée, aucune signature,
aucun ordre. Ce sont des outils de consultation et d'analyse, pas de trading.

## Utilisation

Ouvre `dashboard/index.html` (Hyperliquid) ou `dashboard/polymarket.html` dans un navigateur,
sans serveur ni installation. Des onglets permettent de passer de l'un à l'autre.

Pour le servir localement (facultatif) :

```sh
python3 -m http.server -d dashboard 8000
# puis http://localhost:8000
```

## Fonctionnalités

- Indicateurs : nombre de marchés ouverts, volume 24 h, argent engagé (positions ouvertes),
  marché le plus actif, plus forte variation.
- Cote équivalente (×1/p) à côté de chaque probabilité, et gain pour une mise de 100 $ dans le détail.
- Liste filtrable par catégorie (Crypto, Bourse, Sport, Taux directeurs, Entreprises, Récompenses),
  recherche plein texte, tri par volume, variation, échéance ou probabilité.
- Questions à plusieurs issues (matchs, vainqueurs de championnat, Ballon d'Or, décisions de la Fed,
  tranches de prix) regroupées, avec la probabilité de chaque issue.
- Détail d'un marché : courbe de probabilité (24 h, 7 j, 30 j, 1 an) avec infobulle, carnet d'ordres
  et dernières transactions.
- Thème clair et sombre, mise en page adaptée au mobile.

## Calcul des gains

Un contrat paie 1 USDC si l'issue se réalise, 0 sinon. Acheté au prix `p`, il multiplie la mise
par `1/p` en cas de succès (la « cote »). Exemple : à 21 %, 100 $ achètent 476 contrats, soit
476 $ versés (+376 $) si l'issue se réalise, −100 $ sinon. Le gain espéré dépend de l'écart entre
ta propre estimation `q` et le prix : `mise × (q / p − 1)`, avant frais et glissement de prix.

## Hyperliquid : comment les données sont lues

| Endpoint (`type`)        | Usage                                                     |
|--------------------------|-----------------------------------------------------------|
| `outcomeMeta`            | Liste des outcomes et des questions (gabarits, descriptions) |
| `spotMetaAndAssetCtxs`   | Prix moyen, prix de la veille, volume 24 h de chaque côté |
| `candleSnapshot`         | Historique des prix                                       |
| `l2Book`                 | Carnet d'ordres                                           |
| `recentTrades`           | Dernières transactions                                    |

Chaque outcome s'échange sous forme de deux jetons, un par côté : `#<outcome><côté>`
(par exemple `#145660` pour le côté « Oui » de l'outcome 14566). Le prix d'un contrat,
qui paie 1 USDC si l'issue se réalise, correspond à la probabilité implicite.

La probabilité affichée est le `markPx`, qui suit les dernières transactions : sur un carnet
très creux, le prix moyen entre achat et vente n'a pas de sens. Pour une issue jamais
échangée, c'est le prix moyen du carnet. L'argent engagé correspond aux contrats en circulation,
chacun adossé à 1 USDC jusqu'au règlement. Mise à jour toutes les 30 secondes.

## Polymarket : comment les données sont lues

| API et endpoint                         | Usage                                                   |
|-----------------------------------------|---------------------------------------------------------|
| Gamma `/markets`                        | Les 300 marchés les plus actifs (filtrables par catégorie) |
| Gamma `/events/{id}`                    | Toutes les issues de l'événement sélectionné            |
| CLOB `/prices-history`                  | Historique des prix                                     |
| CLOB `/book`                            | Carnet d'ordres                                         |
| Data `/trades`                          | Dernières transactions                                  |

Polymarket compte des milliers d'événements. Seuls les plus actifs de la catégorie choisie
sont chargés, et les totaux portent sur ceux-là. Mise à jour toutes les minutes.
