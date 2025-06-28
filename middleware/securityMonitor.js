// Advanced security monitoring and threat detection
import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';
import { logger } from '../utils/logger.js';

class SecurityMonitor {
  constructor() {
    this.threats = new Map();
    this.suspiciousIPs = new Set();
    this.failedAttempts = new Map();
    this.securityRules = this.initializeSecurityRules();
    this.alertThresholds = {
      failedLogins: 5,
      suspiciousRequests: 10,
      timeWindow: 15 * 60 * 1000 // 15 minutes
    };
  }

  initializeSecurityRules() {
    return {
      // SQL injection patterns
      sqlInjection: [
        /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/i,
        /((\%3D)|(=))[^\n]*((\%27)|(\')|(\-\-)|(\%3B)|(;))/i,
        /\w*((\%27)|(\'))((\%6F)|o|(\%4F))((\%72)|r|(\%52))/i
      ],
      
      // XSS patterns
      xss: [
        /<script[^>]*>.*?<\/script>/gi,
        /javascript:/gi,
        /on\w+\s*=/gi,
        /<iframe[^>]*>.*?<\/iframe>/gi
      ],
      
      // Directory traversal
      pathTraversal: [
        /\.\.[\/\\]/g,
        /((\%2E){2}((\%2F)|(\%5C)))/i,
        /(\.){2,}[\/\\]/g
      ],
      
      // Command injection
      commandInjection: [
        /[;&|`$(){}[\]]/g,
        /((\%3B)|;)((\%20)|\s)*((\%6F)|o|(\%4F))/i
      ]
    };
  }

  // Analyze request for security threats
  analyzeRequest(req) {
    const threats = [];
    const requestData = {
      url: req.url,
      body: JSON.stringify(req.body || {}),
      query: JSON.stringify(req.query || {}),
      headers: req.headers,
      ip: req.ip,
      userAgent: req.headers['user-agent'] || ''
    };

    // Check for various attack patterns
    Object.entries(this.securityRules).forEach(([threatType, patterns]) => {
      patterns.forEach(pattern => {
        const targets = [requestData.url, requestData.body, requestData.query];
        
        targets.forEach(target => {
          if (pattern.test(target)) {
            threats.push({
              type: threatType,
              pattern: pattern.toString(),
              target,
              severity: this.getThreatSeverity(threatType)
            });
          }
        });
      });
    });

    return threats;
  }

  getThreatSeverity(threatType) {
    const severityMap = {
      sqlInjection: 'high',
      xss: 'medium',
      pathTraversal: 'high',
      commandInjection: 'critical'
    };
    return severityMap[threatType] || 'low';
  }

  // Track failed authentication attempts
  trackFailedAuth(ip, username = null) {
    const key = `${ip}:${username || 'unknown'}`;
    const now = Date.now();
    
    if (!this.failedAttempts.has(key)) {
      this.failedAttempts.set(key, []);
    }
    
    const attempts = this.failedAttempts.get(key);
    attempts.push(now);
    
    // Remove old attempts (outside time window)
    const filtered = attempts.filter(time => 
      now - time < this.alertThresholds.timeWindow
    );
    this.failedAttempts.set(key, filtered);
    
    // Check if threshold exceeded
    if (filtered.length >= this.alertThresholds.failedLogins) {
      this.flagSuspiciousIP(ip, 'excessive_failed_logins');
      return true; // Should block
    }
    
    return false;
  }

  // Flag suspicious IP addresses
  flagSuspiciousIP(ip, reason) {
    this.suspiciousIPs.add(ip);
    
    logger.warn('Suspicious IP detected', {
      ip,
      reason,
      timestamp: new Date().toISOString()
    });
    
    // Auto-expire suspicious IPs after 1 hour
    setTimeout(() => {
      this.suspiciousIPs.delete(ip);
    }, 60 * 60 * 1000);
  }

  // Check if IP is suspicious
  isSuspiciousIP(ip) {
    return this.suspiciousIPs.has(ip);
  }

  // Security middleware
  createSecurityMiddleware() {
    return (req, res, next) => {
      const startTime = Date.now();
      
      // Analyze request for threats
      const threats = this.analyzeRequest(req);
      
      if (threats.length > 0) {
        // Log security threat
        logger.error('Security threat detected', {
          ip: req.ip,
          url: req.url,
          method: req.method,
          threats,
          userAgent: req.headers['user-agent'],
          timestamp: new Date().toISOString()
        });
        
        // Check for critical threats
        const criticalThreats = threats.filter(t => t.severity === 'critical');
        if (criticalThreats.length > 0) {
          return res.status(403).json({
            success: false,
            message: 'Request blocked due to security policy',
            code: 'SECURITY_VIOLATION'
          });
        }
        
        // Flag IP for multiple threats
        if (threats.length >= 3) {
          this.flagSuspiciousIP(req.ip, 'multiple_attack_patterns');
        }
      }
      
      // Check suspicious IPs
      if (this.isSuspiciousIP(req.ip)) {
        return res.status(429).json({
          success: false,
          message: 'Access temporarily restricted',
          code: 'IP_RESTRICTED'
        });
      }
      
      // Track request timing for anomaly detection
      res.on('finish', () => {
        const duration = Date.now() - startTime;
        if (duration > 5000) { // Requests taking longer than 5 seconds
          logger.warn('Slow request detected', {
            ip: req.ip,
            url: req.url,
            duration,
            statusCode: res.statusCode
          });
        }
      });
      
      next();
    };
  }

  // Enhanced rate limiting with adaptive thresholds
  createAdaptiveRateLimit() {
    return rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: (req) => {
        // Stricter limits for suspicious IPs
        if (this.isSuspiciousIP(req.ip)) {
          return 10;
        }
        
        // Different limits based on endpoint sensitivity
        if (req.path.includes('/admin/')) {
          return 30; // Stricter for admin endpoints
        }
        
        if (req.path.includes('/auth/')) {
          return 20; // Stricter for auth endpoints
        }
        
        return 100; // Default limit
      },
      message: (req) => ({
        success: false,
        message: 'Too many requests, please try again later',
        retryAfter: Math.ceil(req.rateLimit.resetTime / 1000)
      }),
      standardHeaders: true,
      legacyHeaders: false,
      onLimitReached: (req) => {
        this.flagSuspiciousIP(req.ip, 'rate_limit_exceeded');
        
        logger.warn('Rate limit exceeded', {
          ip: req.ip,
          url: req.url,
          userAgent: req.headers['user-agent']
        });
      }
    });
  }

  // Progressive delay for repeated requests
  createProgressiveDelay() {
    return slowDown({
      windowMs: 15 * 60 * 1000, // 15 minutes
      delayAfter: 50, // Allow 50 requests at full speed
      delayMs: 500, // Add 500ms delay per request after delayAfter
      maxDelayMs: 20000, // Maximum delay of 20 seconds
      skipSuccessfulRequests: true,
      skipFailedRequests: false
    });
  }

  // Get security metrics
  getSecurityMetrics() {
    return {
      suspiciousIPs: Array.from(this.suspiciousIPs),
      totalSuspiciousIPs: this.suspiciousIPs.size,
      failedAttempts: this.failedAttempts.size,
      recentThreats: Array.from(this.threats.values()),
      lastUpdated: new Date().toISOString()
    };
  }

  // Reset security state (for testing/maintenance)
  reset() {
    this.threats.clear();
    this.suspiciousIPs.clear();
    this.failedAttempts.clear();
  }
}

export default SecurityMonitor;
