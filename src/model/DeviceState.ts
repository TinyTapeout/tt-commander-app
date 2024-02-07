import { createStore } from 'solid-js/store';

export const [deviceState, updateDeviceState] = createStore({
  selectedDesign: 0,
  clockHz: '0',
  uiInEnabled: false,
  uiIn: [] as string[],
});
