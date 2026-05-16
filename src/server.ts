#!/usr/bin/env node
/**
 * phone MCP server. Two tools: `parse` and `format`.
 *
 * Backed by `libphonenumber-js`. Parses an international or local number
 * and returns country/region/E.164/national pieces. Format outputs in any
 * of the standard styles (E.164, international, national, RFC3966).
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { parsePhoneNumberFromString, CountryCode } from 'libphonenumber-js';

const VERSION = '0.1.0';

export interface ParsedPhone {
  input: string;
  valid: boolean;
  country?: string;
  country_calling_code?: string;
  national_number?: string;
  e164?: string;
  international?: string;
  national?: string;
  type?: string;
}

export function parsePhone(input: string, defaultCountry?: string): ParsedPhone {
  const p = parsePhoneNumberFromString(input, defaultCountry as CountryCode | undefined);
  if (!p) return { input, valid: false };
  return {
    input,
    valid: p.isValid(),
    country: p.country,
    country_calling_code: p.countryCallingCode,
    national_number: p.nationalNumber,
    e164: p.number,
    international: p.formatInternational(),
    national: p.formatNational(),
    type: p.getType(),
  };
}

export type FormatStyle = 'e164' | 'international' | 'national' | 'rfc3966';

export function formatPhone(input: string, style: FormatStyle, defaultCountry?: string): string {
  const p = parsePhoneNumberFromString(input, defaultCountry as CountryCode | undefined);
  if (!p) throw new Error('cannot parse: ' + input);
  switch (style) {
    case 'e164':
      return p.number;
    case 'international':
      return p.formatInternational();
    case 'national':
      return p.formatNational();
    case 'rfc3966':
      return p.getURI();
  }
}

const server = new Server({ name: 'phone', version: VERSION }, { capabilities: { tools: {} } });

const TOOLS = [
  {
    name: 'parse',
    description:
      'Parse a phone number. Returns country, calling code, E.164, national, international, line type, and a validity flag.',
    inputSchema: {
      type: 'object',
      properties: {
        input: { type: 'string' },
        default_country: { type: 'string', description: 'ISO 3166-1 alpha-2 (e.g. "US") for ambiguous input.' },
      },
      required: ['input'],
    },
  },
  {
    name: 'format',
    description: 'Format a phone number in e164, international, national, or rfc3966 style.',
    inputSchema: {
      type: 'object',
      properties: {
        input: { type: 'string' },
        style: { type: 'string', enum: ['e164', 'international', 'national', 'rfc3966'] },
        default_country: { type: 'string' },
      },
      required: ['input', 'style'],
    },
  },
] as const;

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const { name, arguments: args } = req.params;
  try {
    if (name === 'parse') {
      const a = args as unknown as { input: string; default_country?: string };
      return jsonResult(parsePhone(a.input, a.default_country));
    }
    if (name === 'format') {
      const a = args as unknown as { input: string; style: FormatStyle; default_country?: string };
      return jsonResult({ formatted: formatPhone(a.input, a.style, a.default_country) });
    }
    return errorResult('unknown tool: ' + name);
  } catch (err) {
    return errorResult('phone tool failed: ' + (err as Error).message);
  }
});

function jsonResult(value: unknown) {
  return { content: [{ type: 'text', text: JSON.stringify(value, null, 2) }] };
}
function errorResult(message: string) {
  return { isError: true, content: [{ type: 'text', text: message }] };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  process.stderr.write(`phone MCP server v${VERSION} ready on stdio\n`);
}
