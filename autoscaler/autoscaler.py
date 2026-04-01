#!/usr/bin/env python3
"""
Docker Swarm Auto-scaler
Monitors Prometheus metrics and scales services based on CPU/memory usage
"""

import os
import time
import requests
import docker
from datetime import datetime

# Configuration
PROMETHEUS_URL = os.getenv('PROMETHEUS_URL', 'http://prometheus:9090')
CHECK_INTERVAL = int(os.getenv('CHECK_INTERVAL', '30'))  # seconds
SCALE_UP_THRESHOLD = float(os.getenv('SCALE_UP_THRESHOLD', '70'))  # CPU/Memory %
SCALE_DOWN_THRESHOLD = float(os.getenv('SCALE_DOWN_THRESHOLD', '30'))  # CPU/Memory %
COOLDOWN_PERIOD = int(os.getenv('COOLDOWN_PERIOD', '60'))  # seconds
BACKEND_MIN_REPLICAS = int(os.getenv('BACKEND_MIN_REPLICAS', '1'))
BACKEND_MAX_REPLICAS = int(os.getenv('BACKEND_MAX_REPLICAS', '3'))
FRONTEND_MIN_REPLICAS = int(os.getenv('FRONTEND_MIN_REPLICAS', '2'))
FRONTEND_MAX_REPLICAS = int(os.getenv('FRONTEND_MAX_REPLICAS', '3'))


def get_replica_bounds(service_name, minimum, maximum):
    """Return safe replica bounds, correcting invalid configs."""
    if minimum < 1:
        print(f"[startup] Warning: {service_name} minimum replicas must be >= 1. Using 1.", flush=True)
        minimum = 1
    if maximum < minimum:
        print(f"[startup] Warning: {service_name} maximum replicas cannot be below minimum. Using {minimum}.", flush=True)
        maximum = minimum
    return minimum, maximum

# Service scaling configuration
backend_min, backend_max = get_replica_bounds('backend', BACKEND_MIN_REPLICAS, BACKEND_MAX_REPLICAS)
frontend_min, frontend_max = get_replica_bounds('frontend', FRONTEND_MIN_REPLICAS, FRONTEND_MAX_REPLICAS)

SERVICES = {
    'taskcollab_backend': {
        'min_replicas': backend_min,
        'max_replicas': backend_max,
        'metrics': ['cpu', 'memory']
    },
    'taskcollab_frontend': {
        'min_replicas': frontend_min,
        'max_replicas': frontend_max,
        'metrics': ['cpu', 'memory']
    }
}

# Track last scaling action to prevent flapping
last_scale_time = {}

def log(message):
    """Log with timestamp"""
    timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    print(f"[{timestamp}] {message}", flush=True)

def query_prometheus(query):
    """Query Prometheus for metrics"""
    try:
        response = requests.get(
            f"{PROMETHEUS_URL}/api/v1/query",
            params={'query': query},
            timeout=10
        )
        response.raise_for_status()
        data = response.json()
        
        if data['status'] == 'success' and data['data']['result']:
            return float(data['data']['result'][0]['value'][1])
        return 0.0
    except Exception as e:
        log(f"Error querying Prometheus: {e}")
        return 0.0

def get_service_cpu_usage(service_name):
    """Get average CPU usage for a service"""
    # Query: Average CPU usage across all containers of the service
    query = f'avg(rate(container_cpu_usage_seconds_total{{container_label_com_docker_swarm_service_name="{service_name}"}}[2m])) * 100'
    return query_prometheus(query)

def get_service_memory_usage(service_name):
    """Get average memory usage percentage for a service"""
    # Query: Average memory usage percentage across all containers
    query = f'avg(container_memory_usage_bytes{{container_label_com_docker_swarm_service_name="{service_name}"}} / container_spec_memory_limit_bytes{{container_label_com_docker_swarm_service_name="{service_name}"}}) * 100'
    return query_prometheus(query)

def get_current_replicas(client, service_name):
    """Get current number of replicas for a service"""
    try:
        service = client.services.get(service_name)
        return service.attrs['Spec']['Mode']['Replicated']['Replicas']
    except Exception as e:
        log(f"Error getting replicas for {service_name}: {e}")
        return None

def scale_service(client, service_name, new_replicas):
    """Scale a service to the specified number of replicas"""
    try:
        service = client.services.get(service_name)
        service.scale(new_replicas)
        log(f"✅ Scaled {service_name} to {new_replicas} replicas")
        last_scale_time[service_name] = time.time()
        return True
    except Exception as e:
        log(f"❌ Error scaling {service_name}: {e}")
        return False

def can_scale(service_name):
    """Check if enough time has passed since last scaling action"""
    if service_name not in last_scale_time:
        return True
    
    elapsed = time.time() - last_scale_time[service_name]
    return elapsed >= COOLDOWN_PERIOD

def evaluate_and_scale(client, service_name, config):
    """Evaluate metrics and scale service if needed"""
    current_replicas = get_current_replicas(client, service_name)
    if current_replicas is None:
        return
    
    # Get metrics
    cpu_usage = get_service_cpu_usage(service_name)
    memory_usage = get_service_memory_usage(service_name)
    
    log(f"{service_name}: {current_replicas} replicas | CPU: {cpu_usage:.1f}% | Memory: {memory_usage:.1f}%")
    
    # Determine if scaling is needed
    max_usage = max(cpu_usage, memory_usage)
    target_replicas = current_replicas
    
    if max_usage > SCALE_UP_THRESHOLD and current_replicas < config['max_replicas']:
        # Scale up
        target_replicas = min(current_replicas + 1, config['max_replicas'])
        action = "SCALE UP"
    elif max_usage < SCALE_DOWN_THRESHOLD and current_replicas > config['min_replicas']:
        # Scale down
        target_replicas = max(current_replicas - 1, config['min_replicas'])
        action = "SCALE DOWN"
    else:
        return  # No scaling needed
    
    # Check cooldown
    if not can_scale(service_name):
        log(f"⏳ {service_name}: Cooldown in effect, skipping {action}")
        return
    
    # Perform scaling
    log(f"🔄 {service_name}: {action} from {current_replicas} to {target_replicas} replicas (usage: {max_usage:.1f}%)")
    scale_service(client, service_name, target_replicas)

def main():
    """Main autoscaler loop"""
    log("🚀 Starting Docker Swarm Auto-scaler")
    log(f"Configuration: Scale UP > {SCALE_UP_THRESHOLD}%, Scale DOWN < {SCALE_DOWN_THRESHOLD}%")
    log(f"Check interval: {CHECK_INTERVAL}s, Cooldown: {COOLDOWN_PERIOD}s")
    log(f"Replica bounds: backend {backend_min}-{backend_max}, frontend {frontend_min}-{frontend_max}")
    
    # Connect to Docker
    try:
        client = docker.from_env()
        log("✅ Connected to Docker daemon")
    except Exception as e:
        log(f"❌ Failed to connect to Docker: {e}")
        return
    
    # Wait for Prometheus to be ready
    log("⏳ Waiting for Prometheus to be ready...")
    for i in range(30):
        try:
            response = requests.get(f"{PROMETHEUS_URL}/-/ready", timeout=2)
            if response.status_code == 200:
                log("✅ Prometheus is ready")
                break
        except:
            time.sleep(2)
    else:
        log("⚠️ Prometheus not ready, continuing anyway...")
    
    # Main loop
    log("🔁 Starting monitoring loop")
    while True:
        try:
            for service_name, config in SERVICES.items():
                evaluate_and_scale(client, service_name, config)
            
            time.sleep(CHECK_INTERVAL)
        except KeyboardInterrupt:
            log("🛑 Shutting down auto-scaler")
            break
        except Exception as e:
            log(f"❌ Error in main loop: {e}")
            time.sleep(CHECK_INTERVAL)

if __name__ == "__main__":
    main()
