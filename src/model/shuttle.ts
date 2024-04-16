// SPDX-License-Identifier: Apache-2.0
// Copyright (C) 2024, Tiny Tapeout LTD
// Author: Uri Shaked

import { createStore } from 'solid-js/store';
import { factoryShuttleId } from './factory';

export interface Project {
  macro: string;
  address: number;
  title: string;
  repo: string;
  clock_hz: number;
}

export const [shuttle, updateShuttle] = createStore({
  id: 'unknown',
  loading: true,
  projects: [] as Project[],
});

export async function loadShuttle(id: string) {
  updateShuttle({
    id,
    projects: [],
    loading: true,
  });
  try {
    const request = await fetch(
      `https://index.tinytapeout.com/${id}.json?fields=title,repo,address,macro,clock_hz`,
    );
    const shuttleIndex: { projects: Project[] } = await request.json();
    shuttleIndex.projects.sort((a, b) => a.title.localeCompare(b.title));
    updateShuttle({ projects: shuttleIndex.projects });
  } finally {
    updateShuttle({ loading: false });
  }
}

const factoryModeShuttle = factoryShuttleId();
if (factoryModeShuttle) {
  loadShuttle(factoryModeShuttle);
}
