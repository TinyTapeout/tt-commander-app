// SPDX-License-Identifier: Apache-2.0
// Copyright (C) 2024, Tiny Tapeout LTD
// Author: Uri Shaked

import { createStore } from 'solid-js/store';

export interface Project {
  macro: string;
  address: number;
  title: string;
  author: string;
  repo: string;
  commit: string;
  clock_hz: number;
  danger_level?: 'high' | 'medium' | 'safe' | 'unknown';
  danger_reason?: string;
  /** Defaults to 'project' when missing. */
  type?: 'project' | 'group' | 'subtile';
  /** Subtile projects only: index of the project within its group. */
  subtile_addr?: number;
}

/**
 * Address of a design on the mux. `subtile` is null for standard projects, and the
 * index within the group for subtile projects (which share the group's mux address).
 */
export interface DesignAddress {
  address: number;
  subtile: number | null;
}

export function projectAddress(project: Project): DesignAddress {
  return {
    address: project.address,
    subtile: project.type === 'subtile' ? (project.subtile_addr ?? 0) : null,
  };
}

/** Formats a design address the way the firmware expects it: `address` or `address-subtile`. */
export function formatDesignAddress(design: DesignAddress) {
  return design.subtile != null ? `${design.address}-${design.subtile}` : `${design.address}`;
}

export function findProject(projects: Project[], design: DesignAddress) {
  return projects.find((project) => {
    const projectDesign = projectAddress(project);
    return projectDesign.address === design.address && projectDesign.subtile === design.subtile;
  });
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
      `https://index.tinytapeout.com/${id}.json?fields=title,author,repo,address,macro,clock_hz,commit,danger_level,danger_reason,type,subtile_addr`,
    );
    const shuttleIndex: { projects: Project[] } = await request.json();
    // Groups only exist to hold subtiles, and can't be enabled on their own.
    const projects = shuttleIndex.projects.filter((project) => project.type !== 'group');
    projects.sort((a, b) => a.title.localeCompare(b.title));
    updateShuttle({ projects });
  } finally {
    updateShuttle({ loading: false });
  }
}
