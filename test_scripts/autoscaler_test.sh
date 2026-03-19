#!/bin/bash
set -e

BASE_URL=${1:-http://localhost:5000}
SERVICE_NAME=${2:-taskcollab_backend}
DURATION=${3:-60}

# Only works on Docker Swarm services
if ! docker info | grep -q "Swarm: active"; then
  echo "⚠️ Docker Swarm not active. Run 'docker swarm init' first."
  exit 1
fi

echo "🚀 Autoscaler smoke test"
echo "Base URL: $BASE_URL"
echo "Service: $SERVICE_NAME"

echo "1) Start load generator for $DURATION seconds..."
end=$((SECONDS + DURATION))
while [ $SECONDS -lt $end ]; do
  curl -s -o /dev/null "$BASE_URL/api/tasks" &
  sleep 0.1
done

wait

echo "2) Check service replicas after load"
replicas=$(docker service inspect --format '{{.Spec.Mode.Replicated.Replicas}}' $SERVICE_NAME 2>/dev/null || echo "N/A")
echo "Replicas: $replicas"

echo "3) Wait 90s for cooldown + scale evaluation"
sleep 90

replicas2=$(docker service inspect --format '{{.Spec.Mode.Replicated.Replicas}}' $SERVICE_NAME 2>/dev/null || echo "N/A")
echo "Replicas after wait: $replicas2"

echo "If autoscaler is configured and running, replicas may have scaled up/down based on usage."
