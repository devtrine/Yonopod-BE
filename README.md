### Setup Yono-BE

## Setup
1. Prepare Postgres and make sure it is running.
2. `cp .env.example .env`
3. Edit `.env`
4. `npm install`
5. `npx sequelize-cli db:migrate`
6. `npx sequelize-cli db:seed:all` (optional untuk seeding data)

## Running the Server
7. `npm run dev`
