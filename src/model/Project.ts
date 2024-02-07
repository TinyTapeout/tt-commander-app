import shuttle from './tt03p5.json';

export interface Project {
  macro: string;
  address: number;
  title: string;
  repo: string;
  clock_hz: number;
}

export function loadProjects() {
  return Object.entries(shuttle.mux).map(([address, project]) => {
    return {
      address: parseInt(address, 10),
      macro: project.macro,
      title: project.title,
      repo: project.repo,
      clock_hz: project.clock_hz,
    } as Project;
  });
}
