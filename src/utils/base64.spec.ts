// SPDX-License-Identifier: Apache-2.0
// Copyright (C) 2026, Tiny Tapeout LTD

import { describe, expect, test } from 'vitest';
import { base64Decode, base64Encode } from './base64';

describe('base64', () => {
  test('round-trips ASCII and non-ASCII text', () => {
    for (const text of ['', 'hello', '[DEFAULT]\nproject = tt_um_test\n', 'héllo wörld ✓']) {
      expect(base64Decode(base64Encode(text))).toBe(text);
    }
  });

  test('matches the standard encoding', () => {
    expect(base64Encode('hello')).toBe('aGVsbG8=');
    expect(base64Decode('aGVsbG8=')).toBe('hello');
  });
});
