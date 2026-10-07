// SPDX-License-Identifier: Apache-2.0
// Copyright (C) 2026, Tiny Tapeout LTD

import { describe, expect, test } from 'vitest';
import { makeDefaultProject } from './configIni';

const firmwareConfig = `# TT 3.5 shuttle user config file
# comment out lines by starting with #

#### DEFAULT Section ####

[DEFAULT]
# project: project to load by default
project = tt_um_factory_test

# start in reset (bool)
start_in_reset = no
mode = ASIC_RP_CONTROL
log_level = INFO

#### PROJECT OVERRIDES ####

[tt_um_factory_test]
clock_frequency = 10
start_in_reset = no
ui_in = 1

[tt_um_urish_simon]
clock_frequency = 50000
mode = ASIC_MANUAL_INPUTS
`;

describe('makeDefaultProject', () => {
  test('updates the default project and adds a section for a new project', () => {
    const result = makeDefaultProject(firmwareConfig, {
      macro: 'tt_um_vga_clock',
      clockHz: 31_500_000,
      uiIn: 0b101,
    });
    expect(result).toBe(`# TT 3.5 shuttle user config file
# comment out lines by starting with #

#### DEFAULT Section ####

[DEFAULT]
# project: project to load by default
project = tt_um_vga_clock

# start in reset (bool)
start_in_reset = no
mode = ASIC_RP_CONTROL
log_level = INFO

#### PROJECT OVERRIDES ####

[tt_um_factory_test]
clock_frequency = 10
start_in_reset = no
ui_in = 1

[tt_um_urish_simon]
clock_frequency = 50000
mode = ASIC_MANUAL_INPUTS

[tt_um_vga_clock]
clock_frequency = 31500000
mode = ASIC_RP_CONTROL
ui_in = 0b00000101
`);
  });

  test('updates an existing project section, keeping its other options', () => {
    const result = makeDefaultProject(firmwareConfig, {
      macro: 'tt_um_factory_test',
      clockHz: 1000,
      uiIn: null,
    });
    expect(result).toContain('project = tt_um_factory_test\n');
    expect(result).toContain(`[tt_um_factory_test]
clock_frequency = 1000
start_in_reset = no
mode = ASIC_MANUAL_INPUTS

[tt_um_urish_simon]`);
    expect(result).not.toContain('ui_in = 1');
  });

  test('replaces the ui_in and mode of an existing section', () => {
    const result = makeDefaultProject(firmwareConfig, {
      macro: 'tt_um_urish_simon',
      clockHz: 50000,
      uiIn: 0xff,
    });
    expect(result).toContain(`[tt_um_urish_simon]
clock_frequency = 50000
mode = ASIC_RP_CONTROL
ui_in = 0b11111111
`);
    expect(result).toContain(`[tt_um_factory_test]
clock_frequency = 10
start_in_reset = no
ui_in = 1
`);
  });

  test('removes clock_frequency when the clock is stopped', () => {
    const result = makeDefaultProject(firmwareConfig, {
      macro: 'tt_um_factory_test',
      clockHz: 0,
      uiIn: 1,
    });
    expect(result).toContain(`[tt_um_factory_test]
start_in_reset = no
ui_in = 0b00000001
mode = ASIC_RP_CONTROL
`);
  });

  test('starts from the template when the board has no config.ini', () => {
    const result = makeDefaultProject('', { macro: 'tt_um_test', clockHz: 10, uiIn: null });
    expect(result).toBe(`# Tiny Tapeout demo board user config file
# See https://github.com/TinyTapeout/tt-micropython-firmware for the available options.

[DEFAULT]
# project: project to load by default
project = tt_um_test

[tt_um_test]
clock_frequency = 10
mode = ASIC_MANUAL_INPUTS
`);
  });

  test('adds a DEFAULT section when missing', () => {
    const result = makeDefaultProject('[tt_um_other]\nclock_frequency = 5\n', {
      macro: 'tt_um_test',
      clockHz: 10,
      uiIn: null,
    });
    expect(result).toBe(`[DEFAULT]
project = tt_um_test

[tt_um_other]
clock_frequency = 5

[tt_um_test]
clock_frequency = 10
mode = ASIC_MANUAL_INPUTS
`);
  });

  test('adds the project option when the DEFAULT section lacks it', () => {
    const result = makeDefaultProject(
      '[DEFAULT]\nlog_level = DEBUG\n\n[tt_um_test]\nmode = SAFE\n',
      {
        macro: 'tt_um_test',
        clockHz: 10,
        uiIn: 0,
      },
    );
    expect(result).toBe(`[DEFAULT]
log_level = DEBUG
project = tt_um_test

[tt_um_test]
mode = ASIC_RP_CONTROL
clock_frequency = 10
ui_in = 0b00000000
`);
  });

  test('normalizes line endings and section headers', () => {
    const result = makeDefaultProject(
      '[DEFAULT]\r\nproject = x\r\n\r\n [tt_um_test] \r\nmode = SAFE\r\n',
      { macro: 'tt_um_test', clockHz: 10, uiIn: null },
    );
    expect(result).toBe(`[DEFAULT]
project = tt_um_test

[tt_um_test]
mode = ASIC_MANUAL_INPUTS
clock_frequency = 10
`);
  });

  test('ignores commented out options', () => {
    const result = makeDefaultProject('[DEFAULT]\n# project = old\nmode = SAFE\n', {
      macro: 'tt_um_test',
      clockHz: 10,
      uiIn: null,
    });
    expect(result).toContain('[DEFAULT]\n# project = old\nmode = SAFE\nproject = tt_um_test\n');
  });
});
