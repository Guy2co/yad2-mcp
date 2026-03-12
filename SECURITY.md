# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| Latest  | ✅ |
| Older   | ❌ |

Always use the latest published version from [GitHub Packages](https://github.com/Guy2co/yad2-mcp/packages).

## Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

To report a vulnerability, open a [GitHub Security Advisory](https://github.com/Guy2co/yad2-mcp/security/advisories/new). You will receive a response within 7 days. If the issue is confirmed, a patch will be released as soon as possible.

## Scope

This project uses Playwright to drive a headless browser. Please report any issue that could:
- Leak credentials or tokens from the environment
- Allow arbitrary code execution via crafted yad2 responses
- Expose user data beyond what yad2 already makes publicly available
