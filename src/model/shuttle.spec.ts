// SPDX-License-Identifier: Apache-2.0
// Copyright (C) 2026, Tiny Tapeout LTD

import { describe, expect, test } from 'vitest';
import { findProject, formatDesignAddress, Project, projectAddress } from './shuttle';

function project(overrides: Partial<Project>): Project {
  return {
    macro: 'tt_um_test',
    address: 0,
    title: 'Test',
    author: 'Tester',
    repo: '',
    commit: '',
    clock_hz: 0,
    ...overrides,
  };
}

const standard = project({ macro: 'tt_um_standard', address: 42 });
const subtile0 = project({
  macro: 'tt_um_subtile0',
  address: 622,
  type: 'subtile',
  subtile_addr: 0,
});
const subtile3 = project({
  macro: 'tt_um_subtile3',
  address: 622,
  type: 'subtile',
  subtile_addr: 3,
});

describe('formatDesignAddress', () => {
  test('formats the design address the way the firmware expects it', () => {
    expect(formatDesignAddress(projectAddress(standard))).toBe('42');
    expect(formatDesignAddress(projectAddress(subtile0))).toBe('622-0');
    expect(formatDesignAddress(projectAddress(subtile3))).toBe('622-3');
  });
});

describe('findProject', () => {
  const projects = [standard, subtile0, subtile3];

  test('matches subtile projects sharing a mux address by their subtile index', () => {
    expect(findProject(projects, { address: 622, subtile: 0 })).toBe(subtile0);
    expect(findProject(projects, { address: 622, subtile: 3 })).toBe(subtile3);
    expect(findProject(projects, { address: 622, subtile: 7 })).toBeUndefined();
  });

  test('does not match a subtile project by the address of its group', () => {
    expect(findProject(projects, { address: 622, subtile: null })).toBeUndefined();
    expect(findProject(projects, { address: 42, subtile: null })).toBe(standard);
  });
});
