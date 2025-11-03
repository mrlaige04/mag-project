docker compose up -d --build

cd src/auth-service
docker compose up -d --build
cd ../..

cd src/card-service
docker compose up -d --build
cd ../..

cd src/history-service
docker compose up -d --build
cd ../..

cd src/payment-service
docker compose up -d --build
cd ../..

cd src/user-service
docker compose up -d --build
cd ../..

cd src/verification-service
docker compose up -d --build
cd ../..