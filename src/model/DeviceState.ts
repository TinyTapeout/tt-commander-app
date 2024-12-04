import { createStore } from 'solid-js/store';

export const [deviceState, updateDeviceState] = createStore({
  selectedDesign: 0,
  clockHz: 0,
  uiInEnabled: false,
  uoOutEnabled: false,
  uiIn: [] as string[],
  uoOutValue: 0,
});
