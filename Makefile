.PHONY: up down build test seed logs clean

up:
	docker compose up --build -d
	@echo ""
	@echo "✅  TicketApp lancé !"
	@echo "   Frontend   : http://localhost:5173"
	@echo "   API        : http://localhost:80"
	@echo "   RabbitMQ   : http://localhost:15672  (guest/guest)"
	@echo "   Docs auth  : http://localhost:8001/api/docs/"
	@echo "   Docs events: http://localhost:8002/api/docs/"
	@echo "   Docs tickets:http://localhost:8003/api/docs/"
	@echo ""
	@echo "   Compte admin : admin@ticketapp.com / Admin1234!"

down:
	docker compose down

logs:
	docker compose logs -f $(s)

all-logs:
	docker compose logs -f

seed:
	@bash scripts/seed.sh

clean:
	docker compose down -v
	@echo "Volumes supprimés."
