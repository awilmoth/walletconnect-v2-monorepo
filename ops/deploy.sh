#!/usr/bin/env bash
source setup

monitoring=${MONITORING:-true} # this makes a bash string, not a boolean
port=${UPSTREAM_PORT:-5000}
replicas=${REPLICAS:-9}
export RELAY_IMAGE=$(cat ./build/build-img-relay-img)
export CADDY_IMAGE=walletconnect/caddy:v2.4.3
export WAKU_IMAGE=$(cat ./build/build-img-waku-img)

run="docker stack deploy $PROJECT -c ops/docker-compose.yml -c ops/docker-compose.prod.yml "

if [[ $monitoring != false ]]; then
  sed "s|{{env \"DOMAIN\"}}|$RELAY_URL|g" ops/grafana/grafana.ini.tmpl > ops/grafana/grafana.ini
  run="${run} -c ops/docker-compose.monitor.yml"
fi

if [[ $NODE_ENV == development ]]; then
  run="${run} -c ops/docker-compose.ci.yml"
fi

printf "\nDeploy command: $run\n\n"
exec env REPLICAS=$replicas UPSTREAM_PORT=$port RELAY_PORT=$port $run
