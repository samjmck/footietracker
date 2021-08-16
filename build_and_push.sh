#!/bin/bash
export DOCKER_BUILDKIT=1
docker build -t samjmck/footietracker-users -f service/users/DockerfileUsers .
docker build -t samjmck/footietracker-dividends -f service/dividends/DockerfileDividends .
docker build -t samjmck/footietracker-spreadsheets -f service/spreadsheets/DockerfileSpreadsheets .
docker build -t samjmck/footietracker-pricing -f service/pricing/DockerfilePricing .

docker push samjmck/footietracker-users
docker push samjmck/footietracker-dividends
docker push samjmck/footietracker-spreadsheets
docker push samjmck/footietracker-pricing
