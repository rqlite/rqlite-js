#!/bin/bash
set -euo pipefail
npm run docker-build
npm run docker-run-test
npm run docker-stop
npm run docker-down
