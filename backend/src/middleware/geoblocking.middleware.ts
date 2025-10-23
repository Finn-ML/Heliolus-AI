/**
 * Geoblocking Middleware
 *
 * Blocks requests from sanctioned countries (Iran, Russia) for compliance
 * with international sanctions and to reduce security risks.
 *
 * Features:
 * - IP-based geolocation using geoip-lite
 * - Configurable blocked countries list
 * - Exempts localhost and private IPs (RFC 1918)
 * - Fail-open design (allows traffic if GeoIP lookup fails)
 * - Comprehensive logging for audit trail
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import geoip from 'geoip-lite';

/**
 * List of blocked country codes (ISO 3166-1 alpha-2)
 *
 * To add or remove countries, modify this array:
 * - IR: Iran
 * - RU: Russia
 *
 * @example
 * // To add North Korea:
 * const BLOCKED_COUNTRIES = ['IR', 'RU', 'KP'];
 */
export const BLOCKED_COUNTRIES = ['IR', 'RU'];

/**
 * Checks if an IP address is localhost or internal/private
 *
 * Exempts:
 * - Localhost: 127.0.0.1, ::1, localhost
 * - RFC 1918 Private networks: 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16
 * - Link-local: 169.254.0.0/16
 *
 * @param ip - IP address to check
 * @returns true if IP is localhost or private
 */
function isLocalOrPrivateIP(ip: string): boolean {
  if (!ip) return true; // Treat missing IP as internal (fail-safe)

  // Normalize IPv6 localhost
  if (ip === '::1' || ip === '::ffff:127.0.0.1') return true;

  // Check IPv4 localhost
  if (ip.startsWith('127.')) return true;

  // Check RFC 1918 private networks
  if (ip.startsWith('10.')) return true;
  if (ip.startsWith('192.168.')) return true;

  // Check 172.16.0.0/12 (172.16.0.0 - 172.31.255.255)
  const octets = ip.split('.');
  if (octets.length === 4) {
    const secondOctet = parseInt(octets[1], 10);
    if (octets[0] === '172' && secondOctet >= 16 && secondOctet <= 31) {
      return true;
    }
  }

  // Check link-local (169.254.0.0/16)
  if (ip.startsWith('169.254.')) return true;

  return false;
}

/**
 * Extracts the real client IP address from the request
 *
 * Checks in order:
 * 1. X-Forwarded-For header (first IP in chain)
 * 2. X-Real-IP header
 * 3. Fastify's request.ip
 *
 * @param request - Fastify request object
 * @returns Client IP address
 */
function extractClientIP(request: FastifyRequest): string {
  // Check X-Forwarded-For (may contain multiple IPs, take first)
  const forwardedFor = request.headers['x-forwarded-for'];
  if (forwardedFor) {
    const ips = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor;
    const firstIP = ips.split(',')[0].trim();
    if (firstIP) return firstIP;
  }

  // Check X-Real-IP
  const realIP = request.headers['x-real-ip'];
  if (realIP) {
    return Array.isArray(realIP) ? realIP[0] : realIP;
  }

  // Fallback to Fastify's extracted IP
  return request.ip;
}

/**
 * Geoblocking middleware for Fastify
 *
 * Blocks requests from countries in BLOCKED_COUNTRIES array.
 * Returns 403 Forbidden with appropriate error message for blocked countries.
 *
 * @param request - Fastify request object
 * @param reply - Fastify reply object
 */
export async function geoblockingMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const startTime = Date.now();

  // Extract client IP
  const clientIP = extractClientIP(request);

  // Exempt localhost and private IPs
  if (isLocalOrPrivateIP(clientIP)) {
    return; // Allow request to proceed
  }

  // Perform GeoIP lookup
  const geoData = geoip.lookup(clientIP);

  // Fail open: if GeoIP lookup fails, allow the request
  // This prevents blocking legitimate users due to database issues
  if (!geoData || !geoData.country) {
    request.log.debug({
      ip: clientIP,
      reason: 'geoip_lookup_failed'
    }, 'GeoIP lookup failed, allowing request');
    return;
  }

  // Check if country is blocked
  const countryCode = geoData.country.toUpperCase();
  if (BLOCKED_COUNTRIES.includes(countryCode)) {
    const duration = Date.now() - startTime;

    // Log blocked request for audit trail
    request.log.warn({
      ip: clientIP,
      country: countryCode,
      path: request.url,
      method: request.method,
      timestamp: new Date().toISOString(),
      duration
    }, 'Request blocked due to geolocation restriction');

    // Return 403 Forbidden with clear error message
    return reply.status(403).send({
      message: 'Access denied from your location',
      code: 'GEO_BLOCKED',
      statusCode: 403,
      timestamp: new Date().toISOString()
    });
  }

  // Country is allowed, proceed with request
  const duration = Date.now() - startTime;

  // Log performance if it exceeds threshold (for monitoring)
  if (duration > 5) {
    request.log.warn({
      ip: clientIP,
      country: countryCode,
      duration
    }, 'Geoblocking check exceeded 5ms threshold');
  }
}
