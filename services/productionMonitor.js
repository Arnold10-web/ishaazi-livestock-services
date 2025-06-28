// Production-ready monitoring dashboard and alerting system
import EventEmitter from 'events';
import os from 'os';
import { performance } from 'perf_hooks';

class ProductionMonitor extends EventEmitter {
  constructor() {
    super();
    this.metrics = {
      system: {
        cpu: [],
        memory: [],
        diskSpace: null,
        networkConnections: 0
      },
      application: {
        uptime: process.uptime(),
        activeUsers: new Set(),
        errorCount: 0,
        requestCount: 0,
        dbConnections: 0,
        cacheHitRate: 0
      },
      business: {
        activeSubscribers: 0,
        contentViews: 0,
        emailsSent: 0,
        userRegistrations: 0
      },
      alerts: []
    };
    
    this.thresholds = {
      cpu: 80,           // 80% CPU usage
      memory: 85,        // 85% memory usage
      errorRate: 5,      // 5% error rate
      responseTime: 2000, // 2 second response time
      diskSpace: 90      // 90% disk usage
    };
    
    this.alerting = {
      channels: [],
      cooldown: 5 * 60 * 1000, // 5 minutes
      lastAlerts: new Map()
    };
    
    this.startMonitoring();
  }

  startMonitoring() {
    // System metrics collection
    setInterval(() => {
      this.collectSystemMetrics();
    }, 30000); // Every 30 seconds
    
    // Business metrics collection
    setInterval(() => {
      this.collectBusinessMetrics();
    }, 60000); // Every minute
    
    // Health check
    setInterval(() => {
      this.performHealthCheck();
    }, 60000); // Every minute
  }

  async collectSystemMetrics() {
    try {
      // CPU usage
      const cpuUsage = await this.getCPUUsage();
      this.metrics.system.cpu.push({
        timestamp: Date.now(),
        usage: cpuUsage
      });
      
      // Memory usage
      const memUsage = process.memoryUsage();
      const totalMem = os.totalmem();
      const freeMem = os.freemem();
      const memoryUsagePercent = ((totalMem - freeMem) / totalMem) * 100;
      
      this.metrics.system.memory.push({
        timestamp: Date.now(),
        usage: memoryUsagePercent,
        heapUsed: memUsage.heapUsed,
        heapTotal: memUsage.heapTotal,
        external: memUsage.external
      });
      
      // Keep only last 100 measurements
      if (this.metrics.system.cpu.length > 100) {
        this.metrics.system.cpu = this.metrics.system.cpu.slice(-100);
      }
      if (this.metrics.system.memory.length > 100) {
        this.metrics.system.memory = this.metrics.system.memory.slice(-100);
      }
      
      // Check thresholds
      this.checkThresholds('cpu', cpuUsage);
      this.checkThresholds('memory', memoryUsagePercent);
      
    } catch (error) {
      console.error('Error collecting system metrics:', error);
    }
  }

  async getCPUUsage() {
    return new Promise((resolve) => {
      const startUsage = process.cpuUsage();
      const startTime = process.hrtime();
      
      setTimeout(() => {
        const endUsage = process.cpuUsage(startUsage);
        const endTime = process.hrtime(startTime);
        
        const totalTime = endTime[0] * 1000000 + endTime[1] / 1000; // microseconds
        const totalUsage = endUsage.user + endUsage.system;
        const cpuPercent = (totalUsage / totalTime) * 100;
        
        resolve(Math.min(100, Math.max(0, cpuPercent)));
      }, 100);
    });
  }

  async collectBusinessMetrics() {
    try {
      // Import models dynamically
      const { default: Subscriber } = await import('../models/Subscriber.js');
      const { default: Blog } = await import('../models/Blog.js');
      const { default: News } = await import('../models/News.js');
      const { default: User } = await import('../models/User.js');
      
      // Active subscribers
      this.metrics.business.activeSubscribers = await Subscriber.countDocuments({ isActive: true });
      
      // Total content views (daily)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const [blogViews, newsViews] = await Promise.all([
        Blog.aggregate([
          { $match: { updatedAt: { $gte: today } } },
          { $group: { _id: null, totalViews: { $sum: '$views' } } }
        ]),
        News.aggregate([
          { $match: { updatedAt: { $gte: today } } },
          { $group: { _id: null, totalViews: { $sum: '$views' } } }
        ])
      ]);
      
      this.metrics.business.contentViews = 
        (blogViews[0]?.totalViews || 0) + (newsViews[0]?.totalViews || 0);
      
      // New user registrations (today)
      this.metrics.business.userRegistrations = await User.countDocuments({
        createdAt: { $gte: today }
      });
      
    } catch (error) {
      console.error('Error collecting business metrics:', error);
    }
  }

  checkThresholds(metric, value) {
    const threshold = this.thresholds[metric];
    if (value > threshold) {
      this.triggerAlert({
        type: 'threshold_exceeded',
        metric,
        value,
        threshold,
        severity: 'warning',
        message: `${metric} usage (${value.toFixed(2)}%) exceeded threshold (${threshold}%)`
      });
    }
  }

  triggerAlert(alert) {
    const alertKey = `${alert.type}_${alert.metric}`;
    const now = Date.now();
    const lastAlert = this.alerting.lastAlerts.get(alertKey);
    
    // Check cooldown
    if (lastAlert && (now - lastAlert) < this.alerting.cooldown) {
      return;
    }
    
    alert.timestamp = new Date().toISOString();
    alert.id = `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    this.metrics.alerts.push(alert);
    this.alerting.lastAlerts.set(alertKey, now);
    
    // Keep only last 100 alerts
    if (this.metrics.alerts.length > 100) {
      this.metrics.alerts = this.metrics.alerts.slice(-100);
    }
    
    console.warn(`🚨 ALERT: ${alert.message}`);
    
    // Emit alert event for external handlers
    this.emit('alert', alert);
    
    // Send to alerting channels
    this.sendAlert(alert);
  }

  async sendAlert(alert) {
    // Email alerting
    if (process.env.ALERT_EMAIL) {
      try {
        const { default: EmailService } = await import('../services/emailService.js');
        await EmailService.sendAlert({
          to: process.env.ALERT_EMAIL,
          subject: `🚨 Production Alert: ${alert.metric}`,
          message: alert.message,
          severity: alert.severity,
          timestamp: alert.timestamp
        });
      } catch (error) {
        console.error('Failed to send email alert:', error);
      }
    }
    
    // Webhook alerting
    if (process.env.ALERT_WEBHOOK) {
      try {
        const response = await fetch(process.env.ALERT_WEBHOOK, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: `🚨 Production Alert: ${alert.message}`,
            alert,
            environment: process.env.NODE_ENV,
            service: 'ishaazi-livestock-services'
          })
        });
        
        if (!response.ok) {
          throw new Error(`Webhook failed: ${response.status}`);
        }
      } catch (error) {
        console.error('Failed to send webhook alert:', error);
      }
    }
  }

  async performHealthCheck() {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      checks: {}
    };
    
    try {
      // Database health
      const { default: mongoose } = await import('mongoose');
      health.checks.database = {
        status: mongoose.connection.readyState === 1 ? 'healthy' : 'unhealthy',
        connections: mongoose.connection.readyState
      };
      
      // Memory health
      const memUsage = process.memoryUsage();
      const memUsagePercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
      health.checks.memory = {
        status: memUsagePercent < this.thresholds.memory ? 'healthy' : 'unhealthy',
        usage: `${memUsagePercent.toFixed(2)}%`,
        heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`
      };
      
      // Disk space health
      const diskUsage = await this.getDiskUsage();
      health.checks.disk = {
        status: diskUsage < this.thresholds.diskSpace ? 'healthy' : 'unhealthy',
        usage: `${diskUsage.toFixed(2)}%`
      };
      
      // API health (response time check)
      const apiHealth = await this.checkAPIHealth();
      health.checks.api = apiHealth;
      
      // Overall health status
      const unhealthyChecks = Object.values(health.checks)
        .filter(check => check.status === 'unhealthy');
      
      if (unhealthyChecks.length > 0) {
        health.status = 'unhealthy';
        this.triggerAlert({
          type: 'health_check_failed',
          metric: 'system_health',
          severity: 'critical',
          message: `Health check failed: ${unhealthyChecks.length} unhealthy services`,
          details: unhealthyChecks
        });
      }
      
    } catch (error) {
      health.status = 'error';
      health.error = error.message;
      console.error('Health check failed:', error);
    }
    
    return health;
  }

  async getDiskUsage() {
    try {
      const stats = await import('fs').then(fs => 
        fs.promises.statfs ? fs.promises.statfs('.') : null
      );
      
      if (stats) {
        const total = stats.blocks * stats.blksize;
        const free = stats.bavail * stats.blksize;
        return ((total - free) / total) * 100;
      }
      
      return 0; // Fallback if statfs not available
    } catch {
      return 0;
    }
  }

  async checkAPIHealth() {
    try {
      const startTime = performance.now();
      
      // Make a simple health check request to our own API
      const response = await fetch('http://localhost:5000/health', {
        timeout: 5000
      });
      
      const responseTime = performance.now() - startTime;
      
      return {
        status: response.ok && responseTime < this.thresholds.responseTime ? 'healthy' : 'unhealthy',
        responseTime: `${Math.round(responseTime)}ms`,
        statusCode: response.status
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message
      };
    }
  }

  // Get comprehensive metrics for dashboard
  getMetrics() {
    return {
      ...this.metrics,
      system: {
        ...this.metrics.system,
        currentCPU: this.metrics.system.cpu[this.metrics.system.cpu.length - 1]?.usage || 0,
        currentMemory: this.metrics.system.memory[this.metrics.system.memory.length - 1]?.usage || 0
      },
      uptime: process.uptime(),
      nodeVersion: process.version,
      platform: os.platform(),
      environment: process.env.NODE_ENV
    };
  }

  // Generate monitoring report
  generateReport() {
    const metrics = this.getMetrics();
    const now = new Date();
    
    return {
      reportId: `report_${Date.now()}`,
      timestamp: now.toISOString(),
      period: '24h',
      summary: {
        uptime: `${Math.floor(metrics.uptime / 3600)}h ${Math.floor((metrics.uptime % 3600) / 60)}m`,
        totalRequests: metrics.application.requestCount,
        errorRate: metrics.application.requestCount > 0 
          ? ((metrics.application.errorCount / metrics.application.requestCount) * 100).toFixed(2) + '%'
          : '0%',
        avgCPU: metrics.system.cpu.length > 0 
          ? (metrics.system.cpu.reduce((sum, m) => sum + m.usage, 0) / metrics.system.cpu.length).toFixed(2) + '%'
          : '0%',
        avgMemory: metrics.system.memory.length > 0
          ? (metrics.system.memory.reduce((sum, m) => sum + m.usage, 0) / metrics.system.memory.length).toFixed(2) + '%'
          : '0%',
        totalAlerts: metrics.alerts.length,
        criticalAlerts: metrics.alerts.filter(a => a.severity === 'critical').length
      },
      metrics,
      recommendations: this.generateRecommendations(metrics)
    };
  }

  generateRecommendations(metrics) {
    const recommendations = [];
    
    if (metrics.system.currentCPU > 70) {
      recommendations.push({
        type: 'performance',
        priority: 'high',
        message: 'High CPU usage detected. Consider scaling horizontally or optimizing code.'
      });
    }
    
    if (metrics.system.currentMemory > 80) {
      recommendations.push({
        type: 'performance',
        priority: 'high',
        message: 'High memory usage detected. Check for memory leaks or increase memory allocation.'
      });
    }
    
    if (metrics.application.errorCount > 10) {
      recommendations.push({
        type: 'reliability',
        priority: 'critical',
        message: 'High error count detected. Review error logs and fix underlying issues.'
      });
    }
    
    return recommendations;
  }
}

export default ProductionMonitor;
