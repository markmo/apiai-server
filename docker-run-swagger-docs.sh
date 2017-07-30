#!/usr/bin/env bash
docker run -p 49132:8080 -e API_URL=http://aiplatform.host/apiai-server/api-docs.json -d swaggerapi/swagger-ui
