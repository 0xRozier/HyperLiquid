# Hyperliquid – tableau de bord des marchés d'outcomes

Tableau de bord **en lecture seule** des marchés de prédiction (« outcomes ») d'Hyperliquid :
probabilités implicites, variations sur 24 h, volumes, historique des prix, carnet d'ordres
et dernières transactions.

Il n'utilise que l'API publique `info` (`https://api.hyperliquid.xyz/info`) : aucun wallet,
aucune clé privée, aucune signature, aucun ordre. C'est un outil de consultation et d'analyse,
pas de trading.

## Utilisation

Ouvre `dashboard/index.html` dans un navigateur, sans serveur ni installation.
Les données se rafraîchissent toutes les 30 secondes.

Pour le servir localement (facultatif) :

```sh
python3 -m http.server -d dashboard 8000
# puis http://localhost:8000
```

## Fonctionnalités

- Indicateurs : nombre de marchés ouverts, volume 24 h total, marché le plus actif, plus forte variation.
- Liste filtrable par catégorie (Crypto, Bourse, Sport, Taux directeurs, Entreprises, Récompenses),
  recherche plein texte, tri par volume, variation, échéance ou probabilité.
- Questions à plusieurs issues (matchs, vainqueurs de championnat, Ballon d'Or, décisions de la Fed,
  tranches de prix) regroupées, avec la probabilité de chaque issue.
- Détail d'un marché : courbe de probabilité (24 h, 7 j, 30 j, 1 an) avec infobulle, carnet d'ordres
  et dernières transactions.
- Thème clair et sombre, mise en page adaptée au mobile.

## Comment les données sont lues

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
