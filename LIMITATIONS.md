# Known Limitations

**IMPORTANT: This is a pre-alpha release. It is not production-ready and has significant limitations.**

This document outlines the known limitations and issues with the current implementation of the Puppeteer service. These limitations will be addressed in future releases.

## Pre-Alpha Status

This project is currently in pre-alpha status, which means:

- APIs may change without warning
- Documentation may be incomplete or outdated
- Features may be partially implemented
- Bugs and stability issues are expected
- Not recommended for production use

## Functional Limitations

### Browser Management

1. **Concurrent Browser Limit**: Limited to 5 concurrent browser instances to prevent resource exhaustion.
2. **Session Persistence**: Browser sessions are not persistent across container restarts.
3. **Resource Cleanup**: Browser instances may not be properly cleaned up if the service crashes.
4. **Memory Management**: No automatic handling of memory-intensive pages, which may cause the container to crash.

### MCP Integration

1. **Transport Layer**: Currently only supports stdio transport via Docker exec, which requires specific permissions.
2. **Error Propagation**: Limited error handling and propagation to LibreChat.
3. **Connection Stability**: stdio connections can be unstable in certain Docker configurations.
4. **No SSE Transport**: SSE transport is planned but not yet implemented.

### Docker Integration

1. **Architecture Dependencies**: System-installed Chromium may behave differently across host architectures.
2. **Network Isolation**: Requires specific Docker network configuration to communicate with LibreChat.
3. **Resource Constraints**: May have issues in limited resource environments (<2GB memory).
4. **Container Privileges**: Requires certain capabilities for Chromium to function correctly.

### Browser Automation

1. **URL Restrictions**: Custom URL validation is implemented but may still reject valid URLs in some cases.
2. **JavaScript Support**: Some modern JavaScript features may not work depending on the Chromium version.
3. **Media Support**: Limited support for audio/video media due to containerization.
4. **File Downloads**: No support for file downloads or uploads.
5. **Geolocation/Permissions**: No support for geolocation or permission handling.

## Technical Limitations

1. **TypeScript Configuration**: Strict import paths with file extensions are required due to the NodeNext module resolution.
2. **No Horizontal Scaling**: No built-in support for load balancing across multiple instances.
3. **No Authentication**: No authentication mechanism for API access.
4. **Limited Monitoring**: Basic health check but no comprehensive monitoring solution.
5. **No Rate Limiting**: No protection against API abuse.

## Documentation Limitations

1. **Incomplete Examples**: Limited usage examples and integration guides.
2. **Missing API Reference**: No comprehensive API reference documentation.
3. **Development Guide**: Limited documentation on how to contribute or develop the service.
4. **Testing Guidance**: Limited documentation on how to test the service.

## Security Considerations

**This pre-alpha release has not undergone security auditing and may contain vulnerabilities.**

1. **Untrusted Content**: Running untrusted web content may pose security risks.
2. **No Input Sanitization**: Limited input validation and sanitization.
3. **No CSRF Protection**: No Cross-Site Request Forgery protection.
4. **No Content Security Policy**: No CSP implementation.
5. **Docker Security**: Requires careful configuration of Docker security settings.

## Future Roadmap

These limitations are acknowledged and will be addressed in future releases according to the priority outlined in our roadmap.

1. **Alpha Release**: Focus on stability, testing, and core functionality.
2. **Beta Release**: API stabilization, documentation, and security improvements.
3. **Production Release**: Performance optimization, scaling capabilities, and comprehensive testing.

Please refer to GitHub issues for specific feature requests and bug reports related to these limitations.