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

/** The ui_in bits selected in the UI, packed into a byte. */
export function uiInValue() {
  let value = 0;
  for (const bit of deviceState.uiIn) {
    value |= 1 << parseInt(bit, 10);
  }
  return value;
}
