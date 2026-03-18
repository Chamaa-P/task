import { Request, Response, NextFunction } from 'express';
import { register, collectDefaultMetrics, Counter, Histogram } from 'prom-client';

// Collect default metrics (CPU, memory, etc.)
collectDefaultMetrics({ prefix: 'taskcollab_' });

// HTTP request counter
export const httpRequestCounter = new Counter({
  name: 'taskcollab_http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

// HTTP request duration histogram
export const httpRequestDuration = new Histogram({
  name: 'taskcollab_http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 2, 5]
});

// Database query counter
export const dbQueryCounter = new Counter({
  name: 'taskcollab_db_queries_total',
  help: 'Total number of database queries',
  labelNames: ['operation']
});

// WebSocket connection gauge
export const wsConnectionGauge = new Counter({
  name: 'taskcollab_websocket_connections_total',
  help: 'Total WebSocket connections',
  labelNames: ['event']
});

// Middleware to track HTTP metrics
export const metricsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route?.path || req.path;
    
    httpRequestCounter.inc({
      method: req.method,
      route: route,
      status_code: res.statusCode
    });
    
    httpRequestDuration.observe({
      method: req.method,
      route: route,
      status_code: res.statusCode
    }, duration);
  });
  
  next();
};

// Endpoint to expose metrics
export const metricsEndpoint = async (req: Request, res: Response) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
};

// Get Prometheus register for custom metrics
export { register };
