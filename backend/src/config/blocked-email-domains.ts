/**
 * Blocked Email Domains Configuration
 *
 * This file contains the list of free/personal email domains that are blocked
 * from user registration. Only business/professional email addresses are allowed.
 *
 * @module blocked-email-domains
 */

/**
 * List of blocked email domains (free/personal email providers)
 * Users must use a business email address to register
 */
export const BLOCKED_EMAIL_DOMAINS = [
  // Major free email providers
  'gmail.com',
  'googlemail.com',
  'yahoo.com',
  'yahoo.co.uk',
  'yahoo.fr',
  'yahoo.de',
  'yahoo.es',
  'yahoo.it',
  'yahoo.com.br',
  'yahoo.co.in',
  'hotmail.com',
  'hotmail.co.uk',
  'hotmail.fr',
  'hotmail.de',
  'hotmail.es',
  'hotmail.it',
  'outlook.com',
  'outlook.fr',
  'outlook.de',
  'outlook.es',
  'outlook.it',
  'live.com',
  'live.co.uk',
  'live.fr',
  'live.de',
  'msn.com',

  // AOL variants
  'aol.com',
  'aol.co.uk',
  'aol.fr',
  'aol.de',

  // Other popular free providers
  'icloud.com',
  'me.com',
  'mac.com',
  'protonmail.com',
  'proton.me',
  'mail.com',
  'gmx.com',
  'gmx.de',
  'gmx.net',
  'yandex.com',
  'yandex.ru',
  'zoho.com',
  'fastmail.com',

  // Temporary/disposable email services
  'tempmail.com',
  'guerrillamail.com',
  '10minutemail.com',
  'mailinator.com',
  'throwaway.email',
  'maildrop.cc',
  'getnada.com',
  'temp-mail.org',
  'trashmail.com',

  // Regional free email providers
  'mail.ru',
  'inbox.ru',
  'bk.ru',
  'list.ru',
  'qq.com',
  '163.com',
  '126.com',
  'sina.com',
  'yeah.net',
  'web.de',
  'freenet.de',
  't-online.de',
  'libero.it',
  'virgilio.it',
  'tiscali.it',
  'orange.fr',
  'wanadoo.fr',
  'free.fr',
  'laposte.net',
  'rediffmail.com',
  'sify.com',
  'mailpro.com',
  'netscape.net',
  'usa.net',
  'att.net',
  'verizon.net',
  'bellsouth.net',
  'sbcglobal.net',
  'cox.net',
  'comcast.net',
];

/**
 * Extract domain from email address
 * Handles sub-domains by returning the root domain (e.g., mail.yahoo.com -> yahoo.com)
 *
 * @param email - Email address to extract domain from
 * @returns Extracted domain in lowercase
 *
 * @example
 * extractDomain('user@company.com') // returns 'company.com'
 * extractDomain('user@mail.yahoo.com') // returns 'yahoo.com'
 * extractDomain('User@COMPANY.COM') // returns 'company.com'
 */
export function extractDomain(email: string): string {
  const emailLower = email.toLowerCase().trim();
  const atIndex = emailLower.indexOf('@');

  if (atIndex === -1) {
    return '';
  }

  const fullDomain = emailLower.substring(atIndex + 1);

  // Handle sub-domains: extract the last two parts (root domain)
  // e.g., mail.yahoo.com -> yahoo.com
  const parts = fullDomain.split('.');

  if (parts.length >= 2) {
    // Return last two parts (root domain)
    return parts.slice(-2).join('.');
  }

  return fullDomain;
}

/**
 * Check if an email domain is blocked (free/personal email provider)
 *
 * @param email - Email address to validate
 * @returns true if the domain is blocked, false if allowed
 *
 * @example
 * isEmailDomainBlocked('user@gmail.com') // returns true
 * isEmailDomainBlocked('user@company.com') // returns false
 * isEmailDomainBlocked('user@mail.yahoo.com') // returns true (sub-domain handling)
 */
export function isEmailDomainBlocked(email: string): boolean {
  const domain = extractDomain(email);

  if (!domain) {
    return false; // Invalid email format, let other validators handle it
  }

  return BLOCKED_EMAIL_DOMAINS.includes(domain);
}

/**
 * Get user-facing error message for blocked email domains
 *
 * @param email - The blocked email address
 * @returns User-friendly error message
 */
export function getBlockedDomainErrorMessage(email: string): string {
  const domain = extractDomain(email);
  return `Personal email addresses (${domain}) are not allowed. Please use your business email address to register.`;
}

/**
 * Add a domain to the blocked list (for dynamic blocking)
 *
 * @param domain - Domain to block (will be converted to lowercase)
 */
export function addBlockedDomain(domain: string): void {
  const normalizedDomain = domain.toLowerCase().trim();
  if (!BLOCKED_EMAIL_DOMAINS.includes(normalizedDomain)) {
    BLOCKED_EMAIL_DOMAINS.push(normalizedDomain);
  }
}

/**
 * Check if a specific domain is in the blocked list
 *
 * @param domain - Domain to check
 * @returns true if domain is blocked
 */
export function isDomainInBlockList(domain: string): boolean {
  return BLOCKED_EMAIL_DOMAINS.includes(domain.toLowerCase().trim());
}
