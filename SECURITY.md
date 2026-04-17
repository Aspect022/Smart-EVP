# Security Policy
## Supported scope
This policy applies to all code in this repository:
- `Backend/`
- `Frontend/`
- `Mobile/`

## Reporting a vulnerability
If you discover a security issue:
1. **Do not** open a public GitHub issue with exploit details.
2. Use GitHub Security Advisories (private reporting) for this repository, or contact the maintainers privately through repository owner channels.
3. Include:
   - affected component(s)
   - reproduction steps
   - impact assessment
   - suggested mitigations (if available)

## Response expectations
Maintainers aim to:
- acknowledge reports as quickly as possible
- reproduce and validate impact
- issue a fix and coordinate disclosure timing

## Security best practices for contributors
- Never commit `.env` files or credentials.
- Use placeholder values in docs and examples.
- Minimize sensitive logs and redact PII in shared output.
- Keep dependencies updated and pin versions where practical.
