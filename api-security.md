# Sécurisation d'une API avec identité anonyme par UUID
 
## Architecture recommandée
 
```
App launch (1ère fois)
    → génère UUID local
    → POST /auth/register-device { device_uuid }
    → API retourne un JWT Access Token + Refresh Token
    → stockés en SecureStorage (flutter_secure_storage)
```
 
---
 
## JWT — Oui, c'est adapté ici
 
Même sans login/password, JWT reste pertinent car :
 
- Il **prouve que le device s'est enregistré** auprès de ton API (pas juste n'importe qui avec un UUID inventé)
- Il te permet de **révoquer l'accès** côté serveur si nécessaire
- Il transporte des **claims utiles** (`device_id`, `created_at`, éventuellement un rôle `anonymous`)
> **Sans JWT**, n'importe qui qui connaît ou génère un UUID valide peut appeler ton API librement — ce n'est pas acceptable.
 
---
 
## Access Token + Refresh Token — Le combo standard
 
| Token | Durée | Rôle |
|---|---|---|
| **Access Token** | 15–60 min | Authentifie chaque requête API |
| **Refresh Token** | 30–90 jours | Échange silencieux contre un nouveau AT |
 
Le Refresh Token doit être stocké en `flutter_secure_storage`, **jamais en SharedPreferences**.
 
À la réinstallation → nouveau UUID → nouveau device enregistré → nouveaux tokens. C'est exactement le comportement voulu.
 
---
 
## Rate Limiting — Indispensable
 
Même avec JWT, il te faut du rate limiting pour protéger contre l'abus :
 
```
Par IP (non authentifié)  → 10 req/min   (pour /auth/register-device)
Par device JWT            → 60–100 req/min  (endpoints normaux)
Par endpoint sensible     → limites spécifiques plus basses
```
 
Côté .NET, tu peux utiliser **`AspNetCoreRateLimit`** ou le rate limiting natif d'ASP.NET Core 7+.
 
---
 
## Flux complet recommandé
 
```
1. Premier lancement
   → UUID généré côté app
   → POST /auth/register-device
   → Reçoit { access_token, refresh_token }
 
2. Chaque requête API
   → Header: Authorization: Bearer <access_token>
 
3. Access Token expiré (401)
   → POST /auth/refresh { refresh_token }
   → Reçoit nouveau { access_token, refresh_token }
 
4. Refresh Token expiré ou révoqué
   → Re-register automatiquement avec le même UUID local
   → Nouveaux tokens transparents pour l'utilisateur
 
5. Désinstallation
   → UUID perdu → device "orphelin" en base
   → Nettoyage périodique des devices inactifs (cron job)
```
 
---
 
## Ce qu'il faut stocker en base côté API
 
```sql
DeviceRegistration
  - id
  - device_uuid         -- ce que l'app génère
  - refresh_token_hash  -- JAMAIS le token en clair
  - created_at
  - last_seen_at
  - is_revoked
```
 
---
 
## Ce que tu n'as PAS besoin de faire
 
- ❌ Pas de PKCE / OAuth2 complet (overkill pour une app anonyme)
- ❌ Pas de client_secret embarqué dans l'APK (facilement extrait)
- ❌ Pas de session server-side stateful (va à l'encontre du but du JWT)
---
 
## Résumé de la stack recommandée
 
| Mécanisme | Décision |
|---|---|
| JWT | ✅ Oui |
| Access Token (15–60 min) | ✅ Oui |
| Refresh Token (30–90 jours) | ✅ Oui |
| Rate Limiting par device | ✅ Oui |
| Rate Limiting sur /register-device | ✅ Oui (anti-spam UUID) |
| Stockage sécurisé Flutter | ✅ `flutter_secure_storage` |
| HTTPS uniquement | ✅ Obligatoire |
| Certificate Pinning | ⚠️ Optionnel mais recommandé si données sensibles |
 
