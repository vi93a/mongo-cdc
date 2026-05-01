default:
    @just --list

build:
    npm run build

start:
    npm run start

dev:
    npm run dev

test:
    npm run test

test-watch:
    npm run test:watch

test-coverage:
    npx vitest run --coverage
