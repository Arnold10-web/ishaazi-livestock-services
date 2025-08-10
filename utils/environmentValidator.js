/**
 * Environment Variables Validation Utility
 * Validates all required environment variables for production deployment
 * 
 * @module utils/environmentValidator
 */

/**
 * Required environment variables for production
 */
const REQUIRED_ENV_VARS = {
  // Database
  MONGO_URI: {
    required: true,
    description: 'MongoDB connection string',
    validation: (value) => value && value.includes('mongodb'),
    errorMessage: 'MONGO_URI must be a valid MongoDB connection string'
  },
  
  // Server Configuration
  PORT: {
    required: false,
    description: 'Server port number',
    default: '3000',
    validation: (value) => !isNaN(parseInt(value)) && parseInt(value) > 0,
    errorMessage: 'PORT must be a valid positive number'
  },
  
  NODE_ENV: {
    required: false,
    description: 'Node environment',
    default: 'development',
    validation: (value) => ['development', 'production', 'test'].includes(value),
    errorMessage: 'NODE_ENV must be development, production, or test'
  },
  
  // Email Configuration
  EMAIL_USER: {
    required: true,
    description: 'Email service username',
    validation: (value) => value && value.includes('@'),
    errorMessage: 'EMAIL_USER must be a valid email address'
  },
  
  EMAIL_PASS: {
    required: true,
    description: 'Email service password',
    validation: (value) => value && value.length >= 8,
    errorMessage: 'EMAIL_PASS must be at least 8 characters long'
  },
  
  // Push Notification VAPID Keys
  PUSH_NOTIFICATION_VAPID_PUBLIC: {
    required: true,
    description: 'VAPID public key for push notifications',
    validation: (value) => value && value.length > 50,
    errorMessage: 'PUSH_NOTIFICATION_VAPID_PUBLIC must be a valid VAPID public key'
  },
  
  PUSH_NOTIFICATION_VAPID_PRIVATE: {
    required: true,
    description: 'VAPID private key for push notifications',
    validation: (value) => value && value.length > 50,
    errorMessage: 'PUSH_NOTIFICATION_VAPID_PRIVATE must be a valid VAPID private key'
  },
  
  // JWT Configuration
  JWT_SECRET: {
    required: false,
    description: 'JWT signing secret',
    default: 'default-secret-change-in-production',
    validation: (value) => value && value.length >= 32,
    errorMessage: 'JWT_SECRET should be at least 32 characters for security'
  },
  
  // Frontend URL (for email templates and CORS)
  FRONTEND_URL: {
    required: false,
    description: 'Frontend application URL',
    default: 'http://localhost:3000',
    validation: (value) => value && (value.startsWith('http://') || value.startsWith('https://')),
    errorMessage: 'FRONTEND_URL must be a valid URL starting with http:// or https://'
  }
};

/**
 * Validation result interface
 * @typedef {Object} ValidationResult
 * @property {boolean} isValid - Whether all validations passed
 * @property {Array} errors - List of validation errors
 * @property {Array} warnings - List of validation warnings
 * @property {Object} summary - Summary of checked variables
 */

/**
 * Validates all environment variables
 * @returns {ValidationResult} Validation results
 */
export function validateEnvironment() {
  const errors = [];
  const warnings = [];
  const summary = {
    total: Object.keys(REQUIRED_ENV_VARS).length,
    validated: 0,
    missing: 0,
    invalid: 0,
    usingDefaults: 0
  };

  console.log('🔍 Validating environment variables...\n');

  for (const [varName, config] of Object.entries(REQUIRED_ENV_VARS)) {
    const value = process.env[varName];
    const hasValue = value !== undefined && value !== null && value !== '';

    if (!hasValue) {
      if (config.required) {
        errors.push(`❌ Missing required environment variable: ${varName} - ${config.description}`);
        summary.missing++;
      } else if (config.default) {
        process.env[varName] = config.default;
        warnings.push(`⚠️  Using default value for ${varName}: ${config.default}`);
        summary.usingDefaults++;
      } else {
        warnings.push(`⚠️  Optional environment variable not set: ${varName} - ${config.description}`);
      }
    } else {
      // Validate the value
      if (config.validation && !config.validation(value)) {
        errors.push(`❌ Invalid value for ${varName}: ${config.errorMessage}`);
        summary.invalid++;
      } else {
        console.log(`✅ ${varName}: Valid`);
        summary.validated++;
      }
    }
  }

  // Check for placeholder values in email configuration
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    const placeholderValues = ['placeholder', 'example', 'test', 'dummy'];
    const emailUser = process.env.EMAIL_USER.toLowerCase();
    const emailPass = process.env.EMAIL_PASS.toLowerCase();
    
    if (placeholderValues.some(placeholder => 
      emailUser.includes(placeholder) || emailPass.includes(placeholder)
    )) {
      warnings.push('⚠️  Email credentials appear to contain placeholder values');
    }
  }

  console.log('\n📊 Environment Validation Summary:');
  console.log(`Total variables checked: ${summary.total}`);
  console.log(`✅ Valid: ${summary.validated}`);
  console.log(`⚠️  Using defaults: ${summary.usingDefaults}`);
  console.log(`❌ Missing: ${summary.missing}`);
  console.log(`❌ Invalid: ${summary.invalid}`);

  if (warnings.length > 0) {
    console.log('\n⚠️  Warnings:');
    warnings.forEach(warning => console.log(warning));
  }

  if (errors.length > 0) {
    console.log('\n❌ Errors:');
    errors.forEach(error => console.log(error));
  }

  const isValid = errors.length === 0;
  
  if (isValid) {
    console.log('\n✅ Environment validation passed!');
  } else {
    console.log('\n❌ Environment validation failed!');
  }

  return {
    isValid,
    errors,
    warnings,
    summary
  };
}

/**
 * Gets environment health status for health checks
 * @returns {Object} Environment health status
 */
export function getEnvironmentHealth() {
  const validation = validateEnvironment();
  
  return {
    status: validation.isValid ? 'healthy' : 'unhealthy',
    details: {
      validationSummary: validation.summary,
      errorCount: validation.errors.length,
      warningCount: validation.warnings.length,
      criticalMissing: validation.errors.filter(error => 
        error.includes('MONGO_URI') || 
        error.includes('EMAIL_USER') || 
        error.includes('EMAIL_PASS')
      ).length
    },
    errors: validation.errors,
    warnings: validation.warnings
  };
}

/**
 * Quick check for critical environment variables
 * @returns {boolean} True if critical variables are present
 */
export function hasRequiredEnvironment() {
  const critical = ['MONGO_URI', 'EMAIL_USER', 'EMAIL_PASS'];
  return critical.every(varName => {
    const value = process.env[varName];
    return value && value.trim() !== '';
  });
}

export default {
  validateEnvironment,
  getEnvironmentHealth,
  hasRequiredEnvironment
};