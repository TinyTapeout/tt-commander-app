// SPDX-License-Identifier: Apache-2.0
// Copyright (C) 2024, Tiny Tapeout LTD
// Author: Uri Shaked

export function factoryShuttleId() {
  return typeof location.href !== 'undefined'
    ? new URL(location.href).searchParams.get('factory')
    : null;
}

export function isFactoryMode() {
  return factoryShuttleId() != null;
}
