.PHONY: setup infra-up infra-down fe-up fe-down logging-up logging-down backend-up backend-down up-all down-all lazy clean llama-agent llama-logging

# Automatically create the external network if it doesn't exist
setup:
	@docker network inspect pomaieco_network >/dev/null 2>&1 || (echo "Creating pomaieco_network..." && docker network create pomaieco_network)

infra-up: setup
	docker compose -f docker-compose.infra.yml up -d

infra-down:
	docker compose -f docker-compose.infra.yml down

fe-up: setup
	cd pomaieco_fe && docker compose up -d

fe-down:
	cd pomaieco_fe && docker compose down

logging-up: setup
	cd pomaiem_logging && docker compose up -d

logging-down:
	cd pomaiem_logging && docker compose down

backend-up: setup
	cd the_pomegranate && docker compose up -d

backend-down:
	cd the_pomegranate && docker compose down

realtime-up:
	cd realtime_hub && docker compose up -d

realtime-down:
	cd realtime_hub && docker compose down

up-all: setup infra-up realtime-up backend-up logging-up fe-up 

down-all: fe-down logging-down backend-down infra-down realtime-down

lazy:
	lazydocker

clean: down-all
	docker system prune -f

llama-agent:
	cd po.cpp && ./build/bin/llama-server -m ../qwen2.5.gguf -c 4096 --port 5002 --host 0.0.0.0

llama-logging:
	cd po.cpp && ./build/bin/llama-server -m ../qwen2.5.gguf -c 4096 --port 5003 --host 0.0.0.0

