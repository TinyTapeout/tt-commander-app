// SPDX-License-Identifier: Apache-2.0
// Copyright (C) 2024, Tiny Tapeout LTD
// Author: Uri Shaked

export function isFactoryMode() {
  return typeof location.href !== 'undefined'
    ? new URL(location.href).searchParams.get('factory') === '1'
    : null;
}
