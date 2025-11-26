docker-compose up -d
docker-compose -f docker-compose.services.yaml up -d

docker compose -f docker-compose.services.yaml --profile tools run --rm auth-migrate
docker compose -f docker-compose.services.yaml --profile tools run --rm user-migrate
docker compose -f docker-compose.services.yaml --profile tools run --rm card-migrate
docker compose -f docker-compose.services.yaml --profile tools run --rm payment-migrate
docker compose -f docker-compose.services.yaml --profile tools run --rm history-migrate
docker compose -f docker-compose.services.yaml --profile tools run --rm verification-migrate