import { createStore } from 'solid-js/store';
import type { DesignAddress } from '~/model/shuttle';

export const [deviceState, updateDeviceState] = createStore({
  selectedDesign: 0,
  /** Subtile index of the selected design, or null when it isn't a subtile project. */
  selectedSubtile: null as number | null,
  clockHz: 0,
  uiInEnabled: false,
  uoOutEnabled: false,
  uiIn: [] as string[],
  uoOutValue: 0,
});

export function selectedDesignAddress(): DesignAddress {
  return { address: deviceState.selectedDesign, subtile: deviceState.selectedSubtile };
}
