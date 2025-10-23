import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';
import Fastify, { FastifyInstance } from 'fastify';

// Mock geoip-lite for integration tests
const mockGeoipLookup = vi.fn();
vi.mock('geoip-lite', () => ({
  lookup: mockGeoipLookup
}));

import { geoblockingMiddleware } from '../../src/middleware/geoblocking.middleware';

describe('Geoblocking Middleware Integration', () => {
  let server: FastifyInstance;

  beforeAll(async () => {
    // Create a minimal Fastify server for testing
    server = Fastify({
      logger: false // Disable logging for cleaner test output
    });

    // Add the geoblocking middleware as a preHandler hook
    server.addHook('preHandler', geoblockingMiddleware);

    // Add a simple test route
    server.get('/test', async () => {
      return { message: 'Success' };
    });

    // Add another test route for different path
    server.get('/api/users', async () => {
      return { users: [] };
    });

    await server.ready();
  });

  afterAll(async () => {
    await server.close();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Request Flow', () => {
    it('should block requests from Iran with 403', async () => {
      mockGeoipLookup.mockReturnValue({
        range: [0, 0],
        country: 'IR',
        region: '',
        eu: '0',
        timezone: 'Asia/Tehran',
        city: '',
        ll: [0, 0],
        metro: 0,
        area: 0
      });

      const response = await server.inject({
        method: 'GET',
        url: '/test',
        remoteAddress: '5.22.200.1' // Iranian IP
      });

      expect(response.statusCode).toBe(403);
      expect(response.json()).toMatchObject({
        message: 'Access denied from your location',
        code: 'GEO_BLOCKED',
        statusCode: 403
      });
    });

    it('should block requests from Russia with 403', async () => {
      mockGeoipLookup.mockReturnValue({
        range: [0, 0],
        country: 'RU',
        region: '',
        eu: '0',
        timezone: 'Europe/Moscow',
        city: '',
        ll: [0, 0],
        metro: 0,
        area: 0
      });

      const response = await server.inject({
        method: 'GET',
        url: '/test',
        remoteAddress: '77.88.55.80' // Russian IP
      });

      expect(response.statusCode).toBe(403);
      expect(response.json()).toMatchObject({
        code: 'GEO_BLOCKED'
      });
    });

    it('should allow requests from United States', async () => {
      mockGeoipLookup.mockReturnValue({
        range: [0, 0],
        country: 'US',
        region: 'CA',
        eu: '0',
        timezone: 'America/Los_Angeles',
        city: 'Mountain View',
        ll: [37.4, -122.1],
        metro: 0,
        area: 0
      });

      const response = await server.inject({
        method: 'GET',
        url: '/test',
        remoteAddress: '8.8.8.8' // Google DNS - US
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual({ message: 'Success' });
    });

    it('should allow requests from Germany', async () => {
      mockGeoipLookup.mockReturnValue({
        range: [0, 0],
        country: 'DE',
        region: '',
        eu: '1',
        timezone: 'Europe/Berlin',
        city: '',
        ll: [51.3, 9.5],
        metro: 0,
        area: 0
      });

      const response = await server.inject({
        method: 'GET',
        url: '/api/users',
        remoteAddress: '46.4.0.1' // German IP
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual({ users: [] });
    });
  });

  describe('Localhost and Private IP Handling', () => {
    it('should allow localhost requests without GeoIP lookup', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/test',
        remoteAddress: '127.0.0.1'
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual({ message: 'Success' });
      expect(mockGeoipLookup).not.toHaveBeenCalled();
    });

    it('should allow private IP 192.168.x.x without GeoIP lookup', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/test',
        remoteAddress: '192.168.1.100'
      });

      expect(response.statusCode).toBe(200);
      expect(mockGeoipLookup).not.toHaveBeenCalled();
    });

    it('should allow private IP 10.x.x.x without GeoIP lookup', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/test',
        remoteAddress: '10.0.0.50'
      });

      expect(response.statusCode).toBe(200);
      expect(mockGeoipLookup).not.toHaveBeenCalled();
    });
  });

  describe('Proxy Header Support', () => {
    it('should extract IP from X-Forwarded-For header', async () => {
      mockGeoipLookup.mockReturnValue({
        range: [0, 0],
        country: 'IR',
        region: '',
        eu: '0',
        timezone: 'Asia/Tehran',
        city: '',
        ll: [0, 0],
        metro: 0,
        area: 0
      });

      const response = await server.inject({
        method: 'GET',
        url: '/test',
        remoteAddress: '127.0.0.1', // Localhost
        headers: {
          'x-forwarded-for': '5.22.200.1, 203.0.113.1' // Iranian IP first
        }
      });

      // Should use the first IP from X-Forwarded-For (5.22.200.1) which is Iranian
      expect(response.statusCode).toBe(403);
      expect(response.json()).toMatchObject({
        code: 'GEO_BLOCKED'
      });
    });

    it('should extract IP from X-Real-IP header', async () => {
      mockGeoipLookup.mockReturnValue({
        range: [0, 0],
        country: 'RU',
        region: '',
        eu: '0',
        timezone: 'Europe/Moscow',
        city: '',
        ll: [0, 0],
        metro: 0,
        area: 0
      });

      const response = await server.inject({
        method: 'GET',
        url: '/test',
        remoteAddress: '127.0.0.1', // Localhost
        headers: {
          'x-real-ip': '77.88.55.80' // Russian IP
        }
      });

      expect(response.statusCode).toBe(403);
      expect(response.json()).toMatchObject({
        code: 'GEO_BLOCKED'
      });
    });
  });

  describe('Fail-Open Behavior', () => {
    it('should allow request when GeoIP lookup returns null', async () => {
      mockGeoipLookup.mockReturnValue(null);

      const response = await server.inject({
        method: 'GET',
        url: '/test',
        remoteAddress: '203.0.113.1' // TEST-NET-3 address
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual({ message: 'Success' });
    });

    it('should allow request when GeoIP lookup returns empty country', async () => {
      mockGeoipLookup.mockReturnValue({
        range: [0, 0],
        country: '',
        region: '',
        eu: '0',
        timezone: '',
        city: '',
        ll: [0, 0],
        metro: 0,
        area: 0
      });

      const response = await server.inject({
        method: 'GET',
        url: '/test',
        remoteAddress: '203.0.113.1'
      });

      expect(response.statusCode).toBe(200);
    });
  });

  describe('HTTP Methods', () => {
    it('should block POST requests from blocked countries', async () => {
      mockGeoipLookup.mockReturnValue({
        range: [0, 0],
        country: 'IR',
        region: '',
        eu: '0',
        timezone: 'Asia/Tehran',
        city: '',
        ll: [0, 0],
        metro: 0,
        area: 0
      });

      const response = await server.inject({
        method: 'POST',
        url: '/test',
        remoteAddress: '5.22.200.1',
        payload: { data: 'test' }
      });

      expect(response.statusCode).toBe(403);
    });

    it('should block PUT requests from blocked countries', async () => {
      mockGeoipLookup.mockReturnValue({
        range: [0, 0],
        country: 'RU',
        region: '',
        eu: '0',
        timezone: 'Europe/Moscow',
        city: '',
        ll: [0, 0],
        metro: 0,
        area: 0
      });

      const response = await server.inject({
        method: 'PUT',
        url: '/test',
        remoteAddress: '77.88.55.80'
      });

      expect(response.statusCode).toBe(403);
    });
  });

  describe('Error Response Consistency', () => {
    it('should always return the same error structure', async () => {
      mockGeoipLookup.mockReturnValue({
        range: [0, 0],
        country: 'IR',
        region: '',
        eu: '0',
        timezone: 'Asia/Tehran',
        city: '',
        ll: [0, 0],
        metro: 0,
        area: 0
      });

      const response = await server.inject({
        method: 'GET',
        url: '/test',
        remoteAddress: '5.22.200.1'
      });

      const body = response.json();
      expect(body).toHaveProperty('message');
      expect(body).toHaveProperty('code');
      expect(body).toHaveProperty('statusCode');
      expect(body).toHaveProperty('timestamp');
      expect(body.message).toBe('Access denied from your location');
      expect(body.code).toBe('GEO_BLOCKED');
      expect(body.statusCode).toBe(403);
      expect(new Date(body.timestamp)).toBeInstanceOf(Date);
    });
  });

  describe('Case Sensitivity', () => {
    it('should handle lowercase country codes', async () => {
      mockGeoipLookup.mockReturnValue({
        range: [0, 0],
        country: 'ir', // lowercase
        region: '',
        eu: '0',
        timezone: 'Asia/Tehran',
        city: '',
        ll: [0, 0],
        metro: 0,
        area: 0
      });

      const response = await server.inject({
        method: 'GET',
        url: '/test',
        remoteAddress: '5.22.200.1'
      });

      expect(response.statusCode).toBe(403);
      expect(response.json()).toMatchObject({
        code: 'GEO_BLOCKED'
      });
    });

    it('should handle mixed case country codes', async () => {
      mockGeoipLookup.mockReturnValue({
        range: [0, 0],
        country: 'Ru', // mixed case
        region: '',
        eu: '0',
        timezone: 'Europe/Moscow',
        city: '',
        ll: [0, 0],
        metro: 0,
        area: 0
      });

      const response = await server.inject({
        method: 'GET',
        url: '/test',
        remoteAddress: '77.88.55.80'
      });

      expect(response.statusCode).toBe(403);
    });
  });
});
