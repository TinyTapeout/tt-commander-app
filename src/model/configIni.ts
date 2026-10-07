// SPDX-License-Identifier: Apache-2.0
// Copyright (C) 2026, Tiny Tapeout LTD

/**
 * Editing of the demo board's config.ini file, which the firmware reads on boot to pick the
 * default project and its settings. The edits are line-based, so comments and the sections of
 * other projects are preserved.
 *
 * The firmware's ini parser is minimal: section headers must be exactly `[name]` on their own
 * line, and line endings must be LF, so the output is normalized accordingly.
 */

export interface DefaultProjectConfig {
  /** Shuttle name of the project, e.g. `tt_um_factory_test`. */
  macro: string;
  /** Project clock frequency in Hz; 0 disables auto-clocking. */
  clockHz: number;
  /** Value to drive on ui_in, or null to leave the inputs undriven (ASIC_MANUAL_INPUTS mode). */
  uiIn: number | null;
}

const configIniTemplate = `# Tiny Tapeout demo board user config file
# See https://github.com/TinyTapeout/tt-micropython-firmware for the available options.

[DEFAULT]
# project: project to load by default
project =
`;

const sectionHeader = /^\s*\[([^\]]*)\]\s*$/;

/** Line range of a section: `start` is the header line, `end` is one past its last line. */
function findSection(lines: string[], name: string) {
  const start = lines.findIndex((line) => line.match(sectionHeader)?.[1].trim() === name);
  if (start < 0) {
    return null;
  }
  const next = lines.findIndex((line, index) => index > start && sectionHeader.test(line));
  return { start, end: next < 0 ? lines.length : next };
}

function trimTrailingBlankLines(lines: string[]) {
  while (lines.length && lines[lines.length - 1].trim() === '') {
    lines.pop();
  }
}

/** Sets an option within an existing section, or removes it when `value` is null. */
function setOption(lines: string[], sectionName: string, key: string, value: string | null) {
  const section = findSection(lines, sectionName)!;
  const body = lines.slice(section.start + 1, section.end);
  const pattern = new RegExp(`^\\s*${key}\\s*=`);
  const index = body.findIndex((line) => pattern.test(line));
  if (index >= 0) {
    if (value == null) {
      lines.splice(section.start + 1 + index, 1);
    } else {
      lines[section.start + 1 + index] = `${key} = ${value}`;
    }
  } else if (value != null) {
    // Insert after the last option, so trailing blank lines stay at the end of the section.
    const last = body.findLastIndex((line) => line.trim() !== '');
    lines.splice(section.start + 2 + last, 0, `${key} = ${value}`);
  }
}

function ensureSection(lines: string[], name: string) {
  const section = findSection(lines, name);
  if (section) {
    // The firmware only recognizes `[name]` without surrounding whitespace.
    lines[section.start] = `[${name}]`;
    return;
  }
  trimTrailingBlankLines(lines);
  if (lines.length) {
    lines.push('');
  }
  lines.push(`[${name}]`);
}

export function formatUiIn(value: number) {
  return `0b${value.toString(2).padStart(8, '0')}`;
}

/**
 * Returns the config.ini content with the given project as the default project and its section
 * updated to the given settings. `existing` is the current content, or empty if the board has
 * no config.ini yet.
 */
export function makeDefaultProject(existing: string, config: DefaultProjectConfig) {
  const lines = (existing || configIniTemplate).split(/\r?\n/);

  if (!findSection(lines, 'DEFAULT')) {
    lines.unshift('[DEFAULT]', '');
  }
  setOption(lines, 'DEFAULT', 'project', config.macro);

  ensureSection(lines, config.macro);
  setOption(
    lines,
    config.macro,
    'clock_frequency',
    config.clockHz > 0 ? `${config.clockHz}` : null,
  );
  // The firmware drives ui_in only in ASIC_RP_CONTROL mode.
  setOption(
    lines,
    config.macro,
    'mode',
    config.uiIn != null ? 'ASIC_RP_CONTROL' : 'ASIC_MANUAL_INPUTS',
  );
  setOption(lines, config.macro, 'ui_in', config.uiIn != null ? formatUiIn(config.uiIn) : null);

  trimTrailingBlankLines(lines);
  return lines.join('\n') + '\n';
}
