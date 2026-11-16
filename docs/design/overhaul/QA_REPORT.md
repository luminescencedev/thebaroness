# QA

| Commande            | Résultat                                                                            |
| ------------------- | ----------------------------------------------------------------------------------- |
| `npm run typecheck` | OK                                                                                  |
| `npm run lint`      | OK                                                                                  |
| `npm run test`      | 46/46 (tests de layout réécrits : landing et shell séparés)                         |
| `npm run build`     | OK                                                                                  |
| `npm run test:e2e`  | 16 passés, 2 ignorés ; parcours connexion adapté (Connexion Steam depuis la pilule) |

Captures : `screenshots/` (landing 320 à 2560, menu mobile, `/dev/ui`, shell).

Limites : pages internes non refaites ; contrastes non mesurés par outil ; widgets en état chargement / erreur non capturés ; « Eternus » rendu serré à petite taille (lecture « Etemus » à 10,5 px, à traiter en polish) ; pas de test e2e dédié à la navbar mobile ; `/dev/ui` présente tokens et bezel, pas encore tous les composants.
