# Claude Code Assistant Configuration - Unity WebGL Platform

This file contains project-specific instructions for Claude Code to help maintain security and code quality.

## Security Reminders

### API Development
When working on API endpoints, Claude should remind you to:
- ✅ Check authentication is implemented
- ✅ Validate all input data with Zod schemas
- ✅ Implement rate limiting
- ✅ Add CSRF protection for state-changing operations
- ✅ Log security events (but sanitize sensitive data)

### Authentication & Authorization
When modifying auth-related code:
- ✅ Ensure server-side validation (not just client-side)
- ✅ Check group/role permissions
- ✅ Implement proper session management
- ✅ Use secure cookie settings

### Unity Integration
When working with Unity bridge:
- ✅ Validate message origins
- ✅ Sanitize data passed between Unity and React
- ✅ Implement message type whitelisting
- ✅ Avoid exposing global objects

### Deployment Checklist
Before deployment, remind to:
- ✅ Run security audit: `npm audit`
- ✅ Check all environment variables are properly set
- ✅ Ensure security headers are configured
- ✅ Verify HTTPS is enforced
- ✅ Review SECURITY_REVIEW.md for outstanding issues

### Docker Security
When modifying Docker configurations:
- ✅ Don't mount sensitive credentials as volumes
- ✅ Run containers as non-root user
- ✅ Use specific image versions (not :latest)
- ✅ Limit container capabilities

## Critical Security Issues Status

**Last Updated:** July 30, 2025

1. ❌ **Unauthenticated API** - `/api/unity-events` needs auth
2. ❌ **Security Headers** - Add to next.config.ts
3. ❌ **Input Validation** - No Zod schemas implemented
4. ❌ **Server Middleware** - Client-side only auth protection
5. ❌ **CSRF Protection** - Not implemented
6. ❌ **Rate Limiting** - No rate limits on APIs

## Auto-Reminders

Claude should proactively remind about security when:
- Creating new API endpoints
- Modifying authentication flows
- Adding new npm dependencies
- Preparing for production deployment
- After completing features (suggest security review)

## References

- Full security review: [SECURITY_REVIEW.md](./SECURITY_REVIEW.md)
- OWASP Top 10: https://owasp.org/www-project-top-ten/
- Next.js Security: https://nextjs.org/docs/advanced-features/security-headers