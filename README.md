# phone-mcp

[![npm](https://img.shields.io/npm/v/@mukundakatta/phone-mcp.svg)](https://www.npmjs.com/package/@mukundakatta/phone-mcp)
[![mcp](https://img.shields.io/badge/protocol-MCP-blue.svg)](https://modelcontextprotocol.io)

MCP server: parse, validate, and format phone numbers worldwide. Backed by
`libphonenumber-js` (Google's libphonenumber data).

## Tools

### `parse`

```json
{ "input": "(415) 555-0100", "default_country": "US" }
```

→

```json
{
  "valid": true,
  "country": "US",
  "country_calling_code": "1",
  "national_number": "4155550100",
  "e164": "+14155550100",
  "international": "+1 415 555 0100",
  "national": "(415) 555-0100",
  "type": "FIXED_LINE_OR_MOBILE"
}
```

### `format`

```json
{ "input": "+14155550100", "style": "international" }
```

→ `"+1 415 555 0100"`

Styles: `e164` (`+14155550100`), `international`, `national`, `rfc3966` (tel URI).

## Configure

```json
{ "mcpServers": { "phone": { "command": "npx", "args": ["-y", "@mukundakatta/phone-mcp"] } } }
```

## License

MIT.
