/**
 * ENHANCED PASSWORD SECURITY POLICY
 * Implements industry-standard password security measures
 */

import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export const ENHANCED_PASSWORD_REQUIREMENTS = {
  minLength: 12,              // Increased from 8
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecial: true,
  maxRepeatingChars: 2,       // Reduced from 3
  preventCommonWords: true,
  preventUserInfo: true,      // NEW: Prevent username/email in password
  historyLength: 5,           // NEW: Prevent reusing last 5 passwords
  maxAge: 90 * 24 * 60 * 60 * 1000, // NEW: 90 days password expiry
};

// Enhanced common passwords list
const ENHANCED_COMMON_PASSWORDS = [
  'password', 'admin123', '123456', 'qwerty', 'letmein', 'welcome', 
  'monkey', 'dragon', 'password123', 'admin', 'root', 'user',
  'pass', '12345678', 'password1', 'abc123', 'Password1',
  'iloveyou', 'sunshine', 'master', 'hello', 'freedom', 'whatever',
  'trustno1', 'jordan23', 'harley', 'robert', 'matthew', 'daniel'
];

/**
 * ENHANCED password validation with comprehensive checks
 */
export function validatePasswordStrength(password, userInfo = {}) {
  const errors = [];
  
  // Basic length checks
  if (password.length < ENHANCED_PASSWORD_REQUIREMENTS.minLength) {
    errors.push(`Password must be at least ${ENHANCED_PASSWORD_REQUIREMENTS.minLength} characters long`);
  }
  
  if (password.length > ENHANCED_PASSWORD_REQUIREMENTS.maxLength) {
    errors.push(`Password cannot exceed ${ENHANCED_PASSWORD_REQUIREMENTS.maxLength} characters`);
  }

  // Character type requirements
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  // Advanced security checks
  
  // Repeating characters check
  const repeatingPattern = new RegExp(`(.)\\1{${ENHANCED_PASSWORD_REQUIREMENTS.maxRepeatingChars},}`);
  if (repeatingPattern.test(password)) {
    errors.push(`Password cannot contain more than ${ENHANCED_PASSWORD_REQUIREMENTS.maxRepeatingChars} repeating characters`);
  }

  // Common password check
  const lowercasePassword = password.toLowerCase();
  if (ENHANCED_COMMON_PASSWORDS.some(common => lowercasePassword.includes(common))) {
    errors.push('Password contains common or easily guessed words');
  }

  // Sequential characters check
  if (/123|abc|qwe|asd|zxc/i.test(password)) {
    errors.push('Password cannot contain sequential characters');
  }

  // User information check
  if (userInfo.username && password.toLowerCase().includes(userInfo.username.toLowerCase())) {
    errors.push('Password cannot contain your username');
  }
  
  if (userInfo.email) {
    const emailParts = userInfo.email.split('@')[0];
    if (password.toLowerCase().includes(emailParts.toLowerCase())) {
      errors.push('Password cannot contain parts of your email address');
    }
  }

  // Keyboard pattern check
  if (/qwerty|asdf|zxcv|1234|abcd/i.test(password)) {
    errors.push('Password cannot contain keyboard patterns');
  }

  return {
    isValid: errors.length === 0,
    errors,
    strength: calculatePasswordStrength(password)
  };
}

/**
 * Calculate password strength score (0-100)
 */
function calculatePasswordStrength(password) {
  let score = 0;
  
  // Base points for length
  score += Math.min(password.length * 2, 25);
  
  // Character diversity
  if (/[a-z]/.test(password)) score += 5;
  if (/[A-Z]/.test(password)) score += 5;
  if (/\d/.test(password)) score += 5;
  if (/[^a-zA-Z0-9]/.test(password)) score += 10;
  
  // Bonus for multiple character types
  const types = [/[a-z]/, /[A-Z]/, /\d/, /[^a-zA-Z0-9]/].filter(type => type.test(password)).length;
  score += types * 5;
  
  // Bonus for length
  if (password.length >= 12) score += 10;
  if (password.length >= 16) score += 15;
  
  // Penalty for common patterns
  if (/(.)\1{2,}/.test(password)) score -= 10; // Repeating chars
  if (/123|abc|qwe/i.test(password)) score -= 15; // Sequential
  
  return Math.min(Math.max(score, 0), 100);
}

/**
 * Generate cryptographically secure password
 */
export function generateSecurePassword(length = 16) {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const special = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  
  const allChars = uppercase + lowercase + numbers + special;
  let password = '';
  
  // Ensure at least one character from each set
  password += uppercase[crypto.randomInt(uppercase.length)];
  password += lowercase[crypto.randomInt(lowercase.length)];
  password += numbers[crypto.randomInt(numbers.length)];
  password += special[crypto.randomInt(special.length)];
  
  // Fill remaining length with random characters
  for (let i = 4; i < length; i++) {
    password += allChars[crypto.randomInt(allChars.length)];
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

/**
 * Hash password with enhanced security
 */
export async function hashPassword(password) {
  // Use higher cost factor for better security
  const saltRounds = process.env.NODE_ENV === 'production' ? 14 : 12;
  return await bcrypt.hash(password, saltRounds);
}

/**
 * Check if password needs to be updated due to age
 */
export function isPasswordExpired(user) {
  if (!user.passwordChangedAt) return false;
  
  const passwordAge = Date.now() - user.passwordChangedAt.getTime();
  return passwordAge > ENHANCED_PASSWORD_REQUIREMENTS.maxAge;
}

/**
 * Check password against history to prevent reuse
 */
export function isPasswordReused(newPassword, passwordHistory = []) {
  return passwordHistory.some(async (hashedPassword) => {
    return await bcrypt.compare(newPassword, hashedPassword);
  });
}
