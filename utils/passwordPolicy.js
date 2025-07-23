/**
 * @file Password Policy Utilities
 * @description Implements password strength and policy validation
 */

export const PASSWORD_REQUIREMENTS = {
    minLength: 8,
    maxLength: 128,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecial: true,
    maxRepeatingChars: 3,
    preventCommonWords: true
};

// Common passwords to prevent
const COMMON_PASSWORDS = [
    'password', 'admin123', '123456', 'qwerty',
    'letmein', 'welcome', 'monkey', 'dragon'
];

/**
 * Validates password strength and compliance with policy
 */
export function validatePassword(password) {
    const errors = [];
    
    // Length checks
    if (password.length < PASSWORD_REQUIREMENTS.minLength) {
        errors.push(`Password must be at least ${PASSWORD_REQUIREMENTS.minLength} characters long`);
    }
    if (password.length > PASSWORD_REQUIREMENTS.maxLength) {
        errors.push(`Password cannot exceed ${PASSWORD_REQUIREMENTS.maxLength} characters`);
    }

    // Character type checks
    if (PASSWORD_REQUIREMENTS.requireUppercase && !/[A-Z]/.test(password)) {
        errors.push('Password must contain at least one uppercase letter');
    }
    if (PASSWORD_REQUIREMENTS.requireLowercase && !/[a-z]/.test(password)) {
        errors.push('Password must contain at least one lowercase letter');
    }
    if (PASSWORD_REQUIREMENTS.requireNumbers && !/\d/.test(password)) {
        errors.push('Password must contain at least one number');
    }
    if (PASSWORD_REQUIREMENTS.requireSpecial && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        errors.push('Password must contain at least one special character');
    }

    // Repeating characters check
    if (PASSWORD_REQUIREMENTS.maxRepeatingChars) {
        const repeatingPattern = new RegExp(`(.)\\1{${PASSWORD_REQUIREMENTS.maxRepeatingChars},}`);
        if (repeatingPattern.test(password)) {
            errors.push(`Password cannot contain more than ${PASSWORD_REQUIREMENTS.maxRepeatingChars} repeating characters`);
        }
    }

    // Common password check
    if (PASSWORD_REQUIREMENTS.preventCommonWords) {
        const lowercasePassword = password.toLowerCase();
        if (COMMON_PASSWORDS.some(common => lowercasePassword.includes(common))) {
            errors.push('Password contains common or easily guessed words');
        }
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}

/**
 * Generates a secure temporary password
 */
export function generateTempPassword() {
    const length = 12;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    
    // Ensure at least one of each required type
    password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)];
    password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)];
    password += '0123456789'[Math.floor(Math.random() * 10)];
    password += '!@#$%^&*'[Math.floor(Math.random() * 8)];
    
    // Fill remaining length with random characters
    for (let i = password.length; i < length; i++) {
        password += charset[Math.floor(Math.random() * charset.length)];
    }
    
    // Shuffle the password
    return password.split('').sort(() => Math.random() - 0.5).join('');
}

/**
 * Check password history to prevent reuse
 */
export function isPasswordReused(newPassword, passwordHistory) {
    return passwordHistory.some(historicPassword => 
        bcrypt.compareSync(newPassword, historicPassword)
    );
}
