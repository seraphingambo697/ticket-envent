# 🎟 TicketApp — Microservices SaaS

Plateforme de billetterie complète construite avec Django, Node.js, React, RabbitMQ et Nginx.

## Architecture

```
Browser
  │
  ▼
Nginx (port 80) ← API Gateway + Rate Limiting
  │
  ├─► auth-service   (Django :8001)  JWT, rôles, login/register
  ├─► event-service  (Django :8002)  CRUD événements, gestion places
  ├─► ticket-service (Django :8003)  Achat, paiement, billets numérotés
  ├─► user-service   (Node.js :3001) CRUD utilisateurs
  │
  ├─► RabbitMQ queue: ticket_purchased
  │     ├─► payment-service  (Node.js :3002)  Traitement paiements async
  │     └─► notif-service    (Node.js :3003)  Email/SMS de confirmation
  │
  └─► PostgreSQL (partagé)   Redis   RabbitMQ
```

## Démarrage rapide

```bash
# 1. Lancer tous les services
docker compose up --build

# OU avec make
make up

# 2. Seeder les données de démo (attendre ~30s le démarrage)
make seed
# OU
bash scripts/seed.sh

# 3. Ouvrir http://localhost:5173
```

## URLs

| Service         | URL                              |
|-----------------|----------------------------------|
| Frontend        | http://localhost:5173            |
| API Gateway     | http://localhost:80              |
| RabbitMQ UI     | http://localhost:15672 (guest/guest) |
| Swagger Auth    | http://localhost:8001/api/docs/  |
| Swagger Events  | http://localhost:8002/api/docs/  |
| Swagger Tickets | http://localhost:8003/api/docs/  |

## Comptes de démo (après seed)

| Email | Mot de passe | Rôle |
|-------|-------------|------|
| admin@ticketapp.com | Admin1234! | admin |
| operator@ticketapp.com | Operator1234! | operator |
| demo@ticketapp.com | Demo1234! | user |

## Cartes de test (paiement)

| Carte | Résultat |
|-------|----------|
| 4111111111111111 | ✅ Succès |
| 4000000000000002 | ❌ Refusée |
| 5100000000000000 | ❌ Provision insuffisante |

## Flux d'achat

```
POST /api/tickets/purchase/
  │
  ├─ 1. GET   event-service  → vérif événement + prix
  ├─ 2. PATCH event-service  → réservation places (SELECT FOR UPDATE, anti-survente)
  ├─ 3. Mock  paiement CB    → débit carte
  └─ 4. PUB   RabbitMQ       → queue ticket_purchased
              ├─ payment-service consomme → enregistrement
              └─ notif-service  consomme → email de confirmation
```

## Commandes utiles

```bash
make up           # Démarrer
make down         # Arrêter
make logs s=ticket-service  # Logs d'un service
make all-logs     # Tous les logs
make seed         # Données de démo
make clean        # Tout supprimer (volumes inclus)
```

## Sécurité

- Mots de passe hashés PBKDF2 (Django) / bcrypt (Node.js) — jamais en clair
- JWT access (1h) + refresh (7j) avec blacklist sur logout
- Rate limiting Nginx : 5 req/s auth, 10 req/s achat, 30 req/s API
- SELECT FOR UPDATE sur les places → anti-survente garanti
- Variables d'environnement pour tous les secrets

## Logs inter-services

Les logs affichent clairement chaque communication :
```
[ticket-service] [COMM → auth-service]   POST /api/auth/verify/
[auth-service]   [VERIFY TOKEN OK]       email=user@test.com role=user
[ticket-service] [COMM ← auth-service]   valid=True (12ms)
[ticket-service] [COMM → event-service]  GET /api/events/{id}/
[ticket-service] [COMM ← event-service]  OK places=498 (8ms)
[ticket-service] [COMM → event-service]  PATCH /seats/ delta=-1
[ticket-service] [ACHAT ÉT.3 OK]        payment_id=pay_xxx
[ticket-service] [RABBIT →]             publish queue=ticket_purchased
[payment-service][RABBIT ←]             paiement enregistré
[notif-service]  [EMAIL SIMULÉ]          À: user@example.com
```
