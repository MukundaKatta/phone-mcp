import { strict as assert } from 'node:assert';
import { test } from 'node:test';

import { parsePhone, formatPhone } from '../src/server.js';

test('parses a US number with country code', () => {
  const r = parsePhone('+1 415 555 0100');
  assert.equal(r.valid, true);
  assert.equal(r.country, 'US');
  assert.equal(r.country_calling_code, '1');
  assert.equal(r.e164, '+14155550100');
});

test('parses a UK number', () => {
  const r = parsePhone('+44 20 7946 0958');
  assert.equal(r.valid, true);
  assert.equal(r.country, 'GB');
});

test('default_country resolves ambiguous national numbers', () => {
  const r = parsePhone('(415) 555-0100', 'US');
  assert.equal(r.valid, true);
  assert.equal(r.e164, '+14155550100');
});

test('valid=false for clearly bad input', () => {
  const r = parsePhone('not a number');
  assert.equal(r.valid, false);
});

test('formats as E.164', () => {
  assert.equal(formatPhone('+1 415 555 0100', 'e164'), '+14155550100');
});

test('formats as national + international', () => {
  const intl = formatPhone('+14155550100', 'international');
  assert.match(intl, /^\+1 /);
  const nat = formatPhone('+14155550100', 'national');
  assert.match(nat, /415/);
});

test('format rfc3966 produces tel: URI', () => {
  const out = formatPhone('+14155550100', 'rfc3966');
  assert.match(out, /^tel:/);
});

test('format throws on unparseable input', () => {
  assert.throws(() => formatPhone('not a number', 'e164'));
});
