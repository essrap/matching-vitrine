# mreguel.com — site vitrine

Statique pur : aucune chaîne de build, aucun framework, aucune dépendance. C'est un
choix — le référencement veut du HTML servi tel quel, et une page qui ne dépend de
rien ne casse jamais au prochain `npm audit`.

```
index.html    la page française (head SEO + données structurées JSON-LD)
ar/index.html la même page en arabe (RTL), liée par hreflang
404.html      page d'erreur de marque (noindex)
styles.css    tokens repris du thème de l'app (matching-front/src/styles/theme.css)
main.js       mosaïque zellige (canvas) + révélation au défilement
og.png        image de partage 1200×630
favicon.svg   même marque que l'app
_headers      en-têtes de cache et de sécurité (fichier natif Cloudflare Pages)
robots.txt · sitemap.xml
```

Les deux langues sont deux fichiers, pas un rendu paramétré : c'est le prix du
« statique pur ». Le RTL ne demande aucune feuille de style séparée — `styles.css`
n'utilise que des propriétés logiques, `dir="rtl"` suffit. **Toute modification de
texte doit être portée dans les deux pages** ; celle de départ,
`scratchpad/build_ar.py` de la session qui l'a créée, n'est pas conservée dans le
repo car elle ne sert qu'une fois.

## Voir la page en local

Rien à installer :

```
python3 -m http.server 4180
```

## Déploiement — Cloudflare Pages

Le site n'a **pas d'étape de build**. Dans les réglages du projet Pages :

| Réglage | Valeur |
|---|---|
| Build command | *(vide)* |
| Build output directory | `/` |
| Root directory | *(vide)* |

Chaque `git push` sur `main` redéploie. Les branches obtiennent une URL de
prévisualisation, ce qui est pratique pour faire relire un texte avant publication.

## DNS — le piège à connaître

Attacher le domaine racine à Pages suppose de basculer les serveurs de noms de
`mreguel.com` chez Cloudflare. Tous les enregistrements se gèrent alors là-bas, y
compris ceux qui pointent vers le VPS.

**Le Caddy du VPS (`matching-front/docker/Caddyfile`) émet lui-même ses
certificats Let's Encrypt.** Si Cloudflare proxifie les sous-domaines du VPS
(nuage orange), il termine le TLS à sa place et le challenge ACME de Caddy peut
échouer — l'API se retrouve sans certificat valide.

| Enregistrement | Cible | Mode Cloudflare |
|---|---|---|
| `mreguel.com` | projet Pages | proxifié (automatique) |
| `app.mreguel.com` | IP du VPS | **DNS only** (nuage gris) |
| `api.mreguel.com` | IP du VPS | **DNS only** (nuage gris) |

En gris, Cloudflare ne fait que résoudre le nom : le VPS continue exactement comme
aujourd'hui, rien à changer côté Caddy.

## Si la vitrine devait revenir sur le VPS

L'option a été écartée, pas condamnée. Le Caddy du front détient déjà les ports
80/443 et sert d'edge unique : un conteneur vitrine ne peut donc pas les prendre,
il faudrait le joindre au réseau Docker `edge` et ajouter au Caddyfile un bloc
`mreguel.com { reverse_proxy matching-vitrine:80 }`. Cloudflare a été préféré pour
le CDN — le temps de réponse est un facteur de classement, et un VPS unique ne
sert que depuis un seul endroit.

## Ce qui reste à faire

- **Rediriger `www` vers l'apex.** `www.mreguel.com` répond aujourd'hui en 200,
  soit le même contenu sur deux hostnames. Les `_redirects` de Pages ne savent
  pas filtrer sur le nom d'hôte : il faut soit retirer `www` des domaines
  personnalisés du projet, soit poser une Redirect Rule Cloudflare
  `www.mreguel.com/*` → `https://mreguel.com/$1` en 301.
- **Étendre `sitemap.xml`** dès qu'une page par métier ou par ville existe.
- **Vérifier les données structurées** avec le test des résultats enrichis de
  Google, sur `/` **et** `/ar/` : le bloc `FAQPage` rend la page éligible aux
  questions dépliées.
- **Déclarer le site** dans la Search Console une fois le DNS en place, et y
  soumettre le sitemap (il porte les deux langues).
- **Recaler la couverture géographique.** Les dix villes sont une hypothèse ;
  les métiers, eux, sont désormais alignés sur `GET /api/v1/categories` — à
  revérifier quand le catalogue bouge, ici comme dans le `hasOfferCatalog` du
  JSON-LD.
- **Compléter les mentions légales de l'app** : la forme juridique et le matricule
  fiscal manquent encore dans les CGU, vers lesquelles le pied de page renvoie.

## Vérification

Servi localement puis contrôlé au navigateur réel (Playwright) en clair, sombre et
mobile : aucune erreur console, aucun débordement horizontal.
