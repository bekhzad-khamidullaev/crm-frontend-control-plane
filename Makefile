.PHONY: help install dev build test lint format clean deploy health backup

# Variables
DOCKER_COMPOSE = docker-compose
NODE = npm

# Help
help:
	@echo "🚀 CRM Frontend - Available Commands"
	@echo ""
	@echo "Development:"
	@echo "  make install     - Install dependencies"
	@echo "  make dev         - Start development server"
	@echo "  make build       - Build for production"
	@echo "  make test        - Run tests"
	@echo "  make lint        - Run linter"
	@echo "  make format      - Format code"
	@echo ""
	@echo "Docker:"
	@echo "  make docker-build     - Build Docker image"
	@echo "  make docker-up        - Start Docker containers"
	@echo "  make docker-down      - Stop Docker containers"
	@echo "  make docker-logs      - View Docker logs"
	@echo ""
	@echo "Deployment:"
	@echo "  make deploy-prod      - Deploy to production"
	@echo "  make deploy-staging   - Deploy to staging"
	@echo "  make health           - Run health check"
	@echo "  make backup           - Create backup"
	@echo ""
	@echo "Cleanup:"
	@echo "  make clean            - Clean build artifacts"
	@echo "  make clean-all        - Clean everything including node_modules"

# Development
install:
	$(NODE) install

dev:
	$(NODE) run dev

build:
	$(NODE) run build:production

build-staging:
	$(NODE) run build:staging

test:
	$(NODE) run test

test-watch:
	$(NODE) run test:watch

test-coverage:
	$(NODE) run test:ci

lint:
	$(NODE) run lint

lint-fix:
	$(NODE) run lint:fix

format:
	$(NODE) run format

format-check:
	$(NODE) run format:check

# Docker
docker-build:
	$(DOCKER_COMPOSE) build frontend

docker-build-staging:
	$(DOCKER_COMPOSE) build frontend-staging

docker-up:
	$(DOCKER_COMPOSE) up -d frontend

docker-up-staging:
	$(DOCKER_COMPOSE) --profile staging up -d frontend-staging

docker-down:
	$(DOCKER_COMPOSE) down

docker-restart:
	$(DOCKER_COMPOSE) restart frontend

docker-logs:
	$(DOCKER_COMPOSE) logs -f frontend

docker-logs-staging:
	$(DOCKER_COMPOSE) --profile staging logs -f frontend-staging

docker-ps:
	$(DOCKER_COMPOSE) ps

docker-shell:
	$(DOCKER_COMPOSE) exec frontend sh

# Deployment
deploy-prod:
	./deploy.sh production

deploy-staging:
	./deploy.sh staging

deploy-local:
	./deploy.sh local

health:
	./scripts/health-check.sh

backup:
	./scripts/backup.sh

setup-server:
	sudo ./scripts/setup-server.sh

# Cleanup
clean:
	rm -rf dist/ coverage/ *.log

clean-all: clean
	rm -rf node_modules/ backups/

# Docker cleanup
docker-clean:
	$(DOCKER_COMPOSE) down -v
	docker system prune -f

docker-clean-all:
	$(DOCKER_COMPOSE) down -v
	docker system prune -a --volumes -f
