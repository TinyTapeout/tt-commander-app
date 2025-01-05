export const minimumFirmwareVersion = '2.0.0RC2';
export const latestFirmwareVersion = '2.0.2';

export function firmwareDownloadURL(version: string) {
  return `https://github.com/TinyTapeout/tt-micropython-firmware/releases/download/v${version}/tt-demo-rp2040-v${version}.uf2`;
}

/**
 * Parse firmware version.
 * Version string should be in the format of 'major.minor.patch[alpha|beta|RC][number]' or 'major.minor-dev'.
 *
 * @param version version string (without 'v' prefix, e.g. '2.0.0')
 * @returns parsed version
 */
export function parseFirmwareVersion(version: string) {
  if (version.endsWith('-dev')) {
    const match = version.match(/^(\d+).(\d+)-dev$/);
    if (!match) {
      throw new Error(`Invalid firmware version: ${version}`);
    }
    return {
      major: parseInt(match[1], 10),
      minor: parseInt(match[2], 10),
      patch: 0,
      preRelease: 'dev',
      preReleaseNumber: 0,
    };
  }

  const match = version.match(/^(\d+).(\d+).(\d+)(RC|beta|alpha)?(\d+)?$/);
  if (!match || (match[4] && !match[5])) {
    throw new Error(`Invalid firmware version: ${version}`);
  }
  return {
    major: parseInt(match[1], 10),
    minor: parseInt(match[2], 10),
    patch: parseInt(match[3], 10),
    preRelease: match[4] ?? null,
    preReleaseNumber: match[5] ? parseInt(match[5], 10) : null,
  };
}

/**
 * Compare two firmware versions
 * @param a - first version
 * @param b - second version
 * @returns -1 if a < b, 0 if a == b, 1 if a > b
 */
export function compareVersions(a: string, b: string) {
  const versionA = parseFirmwareVersion(a);
  const versionB = parseFirmwareVersion(b);
  if (versionA.major !== versionB.major) {
    return versionA.major - versionB.major;
  }
  if (versionA.minor !== versionB.minor) {
    return versionA.minor - versionB.minor;
  }
  if (versionA.preRelease === 'dev' && versionB.preRelease !== 'dev') {
    return 1;
  }
  if (versionA.patch !== versionB.patch) {
    return versionA.patch - versionB.patch;
  }
  if (versionA.preRelease === versionB.preRelease) {
    return (versionA.preReleaseNumber ?? 0) - (versionB.preReleaseNumber ?? 0);
  }
  if (versionA.preRelease === 'alpha') {
    return -1;
  }
  if (versionB.preRelease === 'alpha') {
    return 1;
  }
  if (versionA.preRelease === 'beta') {
    return -1;
  }
  if (versionB.preRelease === 'beta') {
    return 1;
  }
  if (versionA.preRelease === 'RC') {
    return -1;
  }
  if (versionB.preRelease === 'RC') {
    return 1;
  }
  return 0;
}
