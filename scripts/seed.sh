#!/usr/bin/env bash
# seed.sh — Crée des données de démo
set -e
BASE="${API_URL:-http://localhost}"
echo "🌱 Seeding TicketApp..."

# Login admin
RESP=$(curl -sf -X POST "$BASE/api/auth/login/" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@ticketapp.com","password":"Admin1234!"}')
TOKEN=$(echo "$RESP" | python3 -c "import sys,json;print(json.load(sys.stdin)['access'])")
echo "✓ Token admin obtenu"

# Créer un opérateur
curl -sf -X POST "$BASE/api/auth/register/" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"email":"operator@ticketapp.com","password":"Operator1234!","first_name":"Jean","last_name":"Dupont","role":"operator"}' > /dev/null \
  && echo "✓ Opérateur créé : operator@ticketapp.com / Operator1234!" || echo "  (opérateur déjà existant)"

# Login opérateur
OP=$(curl -sf -X POST "$BASE/api/auth/login/" \
  -H "Content-Type: application/json" \
  -d '{"email":"operator@ticketapp.com","password":"Operator1234!"}')
OP_TOKEN=$(echo "$OP" | python3 -c "import sys,json;print(json.load(sys.stdin)['access'])")

# Événements
curl -sf -X POST "$BASE/api/events/" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $OP_TOKEN" \
  -d '{"title":"Rock Festival Paris 2026","description":"3 scènes, 20 artistes, une nuit inoubliable.","venue":"Stade de France","city":"Paris","date":"2026-07-15T19:00:00Z","total_seats":5000,"price":"89.99","status":"published"}' > /dev/null \
  && echo "✓ Event 1 créé"

curl -sf -X POST "$BASE/api/events/" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $OP_TOKEN" \
  -d '{"title":"Jazz Night — Le Bataclan","description":"Une soirée intime avec les meilleurs jazzmen parisiens.","venue":"Le Bataclan","city":"Paris","date":"2026-08-10T21:00:00Z","total_seats":300,"price":"35.00","status":"published"}' > /dev/null \
  && echo "✓ Event 2 créé"

curl -sf -X POST "$BASE/api/events/" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $OP_TOKEN" \
  -d '{"title":"Conférence Tech Lyon 2026","description":"Cloud, IA et DevOps — 2 jours de conférences.","venue":"Centre de Congrès","city":"Lyon","date":"2026-09-20T09:00:00Z","total_seats":800,"price":"0.00","status":"published"}' > /dev/null \
  && echo "✓ Event 3 créé"

# User démo
curl -sf -X POST "$BASE/api/auth/register/" \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@ticketapp.com","password":"Demo1234!","first_name":"Marie","last_name":"Demo"}' > /dev/null \
  && echo "✓ User démo : demo@ticketapp.com / Demo1234!" || echo "  (déjà existant)"

echo ""
echo "✅ Seed terminé !"
echo ""
echo "  Comptes :"
echo "   admin@ticketapp.com    / Admin1234!     (admin)"
echo "   operator@ticketapp.com / Operator1234!  (operator)"
echo "   demo@ticketapp.com     / Demo1234!      (user)"
