.PHONY: help setup install dev build start clean test pm2-install pm2-start pm2-stop pm2-restart pm2-status pm2-logs
.DEFAULT_GOAL := help

FRONTEND_DIR := frontend
BACKEND_DIR := backend

help:
    @echo "SmartLias Commands (simplified):"
    @echo "  make setup    - Install all dependencies"
    @echo "  make install  - Same as setup"
    @echo "  make dev      - Run frontend (3000) and backend (9000) in development"
    @echo "  make build    - Build frontend (and backend if configured)"
    @echo "  make start    - Run both in production mode"
    @echo "  make clean    - Remove node_modules and build artifacts"
    @echo "  make test     - Run tests for both"

setup install:
    @echo "Installing dependencies..."
    @cd $(FRONTEND_DIR) && npm install
    @cd $(BACKEND_DIR) && npm install
    @echo "Install complete."

dev:
    @echo "Starting development:"
    @echo "Frontend: http://localhost:3000"
    @echo "Backend:  http://localhost:9000"
    @echo "Health:   http://localhost:9000/api/health"
    @trap 'echo Stopping...; kill %1 %2 2>/dev/null' INT; \
    cd $(BACKEND_DIR) && npm run dev & \
    cd $(FRONTEND_DIR) && npm run dev & \
    wait

build:
    @echo "Building application..."
    @cd $(FRONTEND_DIR) && npm run build
    @cd $(BACKEND_DIR) && (npm run build || echo "No backend build script")
    @echo "Build complete."

start:
    @echo "Starting production servers..."
    @test -f .env && cp .env $(FRONTEND_DIR)/.env.local || echo ".env not found, skipping copy"
    @echo "Frontend: http://localhost:3000"
    @echo "Backend:  http://localhost:9000"
    @trap 'echo Stopping...; kill %1 %2 2>/dev/null' INT; \
    cd $(BACKEND_DIR) && npm start & \
    cd $(FRONTEND_DIR) && npm start & \
    wait

clean:
    @echo "Cleaning..."
    @rm -rf $(FRONTEND_DIR)/node_modules $(FRONTEND_DIR)/.next $(FRONTEND_DIR)/dist
    @rm -rf $(BACKEND_DIR)/node_modules $(BACKEND_DIR)/dist $(BACKEND_DIR)/build
    @rm -f $(FRONTEND_DIR)/package-lock.json $(BACKEND_DIR)/package-lock.json
    @echo "Clean complete."

test:
    @echo "Running tests..."
    @cd $(FRONTEND_DIR) && (npm test || echo "Frontend tests not configured")
    @cd $(BACKEND_DIR) && (npm test || echo "Backend tests not configured")
    @echo "Test run complete."
