# Epic 4: Security & Compliance Features

## Epic ID
Epic-4

## Epic Title
Security & Compliance Features

## Epic Description
Implement security and compliance features to protect the platform and ensure regulatory compliance, starting with IP-based geoblocking to restrict access from sanctioned countries.

## Business Value
- **Risk Mitigation**: Prevent access from high-risk jurisdictions (Iran, Russia)
- **Compliance**: Meet international sanctions and export control requirements
- **Security Posture**: Reduce attack surface from state-sponsored threats
- **Audit Trail**: Demonstrate proactive security measures for compliance audits

## Success Metrics
- 100% of requests from Iran (IR) and Russia (RU) blocked at application layer
- Zero false positives (legitimate users not blocked)
- Blocked request logging for audit purposes
- Response time impact <5ms per request

## Technical Overview
Implement middleware-based geolocation checking using the geoip-lite library to identify and block requests originating from specified countries before they reach application routes.

## User Stories

### Story 4.1: Implement IP Geoblocking Middleware
**Priority**: P0 (Security Critical)
**Estimated Effort**: 1-2 hours

**As a** platform administrator,
**I want** requests from sanctioned countries (Iran and Russia) to be automatically blocked,
**so that** we comply with international sanctions and reduce security risks.

**Acceptance Criteria**:
1. All HTTP requests are checked for country of origin based on IP address
2. Requests from Iran (country code: IR) return HTTP 403 Forbidden
3. Requests from Russia (country code: RU) return HTTP 403 Forbidden
4. Blocked requests include clear error message indicating geo-restriction
5. Blocked requests are logged with IP, country, timestamp, and attempted endpoint
6. Geoblocking check occurs before authentication middleware (blocks before any processing)
7. Internal/localhost IPs are exempt from geoblocking
8. Error response includes appropriate headers (no sensitive information leaked)
9. Performance impact is minimal (<5ms per request)
10. Configuration allows easy addition/removal of blocked countries

**Technical Notes**:
- Use `geoip-lite` npm package (free, no external API, ~10MB database)
- Implement as Fastify preHandler middleware
- Add to server.ts before other middleware
- Country codes: IR (Iran), RU (Russia)
- Consider IPv4 and IPv6 support
- Handle cases where GeoIP lookup fails (allow by default for safety)

**Dependencies**:
- None (standalone security feature)

**Related Epics**:
- Future stories may add additional security features (rate limiting enhancements, DDoS protection, etc.)
