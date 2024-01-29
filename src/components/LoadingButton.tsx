// SPDX-License-Identifier: Apache-2.0
// Copyright (C) 2024, Tiny Tapeout LTD

import { Button, CircularProgress } from '@suid/material';
import { ButtonProps } from '@suid/material/Button';
import { Show, splitProps } from 'solid-js';

export interface ILoadingButtonProps extends ButtonProps {
  loading: boolean;
}

export function LoadingButton(props: ILoadingButtonProps) {
  const [myProps, rest] = splitProps(props, ['loading', 'children', 'disabled']);

  return (
    <Button {...rest} disabled={myProps.disabled || myProps.loading}>
      <Show when={!myProps.loading} fallback={<CircularProgress size={24} />}>
        {myProps.children}
      </Show>
    </Button>
  );
}
