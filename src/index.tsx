// SPDX-License-Identifier: Apache-2.0
// Copyright (C) 2024, Tiny Tapeout LTD

/* @refresh reload */
import { render } from 'solid-js/web';
import { App } from './components/App';

const root = document.getElementById('root');
render(() => <App />, root!);
