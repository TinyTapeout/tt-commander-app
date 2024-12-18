import { Error, Warning } from '@suid/icons-material';
import {
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@suid/material';
import createElementRef from '@suid/system/createElementRef';
import { createSelect, fuzzyHighlight, fuzzySearch } from '@thisbeyond/solid-select';
import { For, Show, createEffect } from 'solid-js';
import { Project } from '~/model/shuttle';
import { fuzzySort } from '~/utils/fuzzySort';
import { Popper } from './Popper';

export interface IProjectSelectProps {
  selectedAddr: number;
  projects: Project[];
  onSelect: (address: number) => void;
}

export function ProjectListItem(props: { project: Project; search: string }) {
  const trimmedSearch = () => props.search.trim();

  const title = () =>
    trimmedSearch()
      ? fuzzyHighlight(fuzzySearch(trimmedSearch(), props.project.title))
      : props.project.title;

  const author = () =>
    trimmedSearch()
      ? fuzzyHighlight(fuzzySearch(trimmedSearch(), props.project.author))
      : props.project.author;

  return (
    <Stack direction="row" spacing={2} maxWidth={'400px'}>
      <code style={{ 'min-width': '32px', 'text-align': 'right' }}>{props.project.address}</code>
      <Stack flex={1}>
        <Typography flex={1} minWidth="100%" whiteSpace="pre-wrap">
          {title()}
          <Show when={props.project.danger_level === 'medium'}>
            <span title={props.project.danger_reason}>
              <Warning
                color="warning"
                fontSize="small"
                sx={{ verticalAlign: 'middle', marginLeft: 1 }}
              />
            </span>
          </Show>
          <Show when={props.project.danger_level === 'high'}>
            <span title={props.project.danger_reason}>
              <Error
                color="error"
                fontSize="small"
                sx={{ verticalAlign: 'middle', marginLeft: 1 }}
              />
            </span>
          </Show>
        </Typography>
        <Typography
          variant="body2"
          color="textSecondary"
          title={props.project.author}
          overflow="hidden"
          whiteSpace="nowrap"
          textOverflow="ellipsis"
          width={0}
          minWidth="100%"
        >
          by {author()}
        </Typography>
      </Stack>
    </Stack>
  );
}

export function ProjectSelect(props: IProjectSelectProps) {
  const selectedProject = () => props.projects.find((x) => x.address === props.selectedAddr);

  const select = createSelect({
    options: (inputValue: string) => {
      if (!inputValue) {
        return props.projects;
      }

      return fuzzySort(inputValue, props.projects, ['title', 'author']).map((x) => x.item);
    },
    onChange: (value) => value && props.onSelect(value.address),
  });

  const fieldRef = createElementRef();

  createEffect(() => {
    select.setValue(selectedProject());
    select.setInputValue('');
  });

  return (
    <>
      <TextField
        ref={fieldRef}
        label="Project"
        disabled={select.disabled}
        size="small"
        autoComplete="off"
        fullWidth
        InputLabelProps={{
          shrink: true,
          sx: { textTransform: 'capitalize' },
        }}
        sx={{
          '& .MuiInputBase-root': {
            flexWrap: 'wrap',
            padding: '6px 6px 6px 14px',
            background: 'white',
          },
          '& .MuiInputBase-input': {
            padding: '2.5px 0px',
            minWidth: 30,
            width: 0,
            flexGrow: 1,
            ...(select.isActive() ? {} : { caretColor: 'transparent' }),
          },
        }}
        onFocusIn={select.onFocusIn}
        onFocusOut={select.onFocusOut}
        onClick={() => !select.disabled && select.toggleOpen()}
        onChange={(_, value) => {
          select.setInputValue(value);
        }}
        onKeyDown={select.onKeyDown}
        value={(select.inputValue() || select.value()?.title) ?? ''}
      />

      <Popper
        open={select.isOpen()}
        anchorEl={fieldRef.ref}
        placement="bottom"
        onMouseDown={select.onMouseDown}
      >
        <Paper
          sx={{
            overflow: 'auto',
            minWidth: fieldRef.ref.clientWidth,
          }}
        >
          <List sx={{ maxHeight: '40vh', overflow: 'auto' }}>
            <For
              each={select.options()}
              fallback={
                <ListItem>
                  <ListItemText>No matching projects</ListItemText>
                </ListItem>
              }
            >
              {(option) => (
                <ListItemButton
                  onClick={() => select.pickOption(option)}
                  selected={select.isOptionFocused(option)}
                  disabled={select.isOptionDisabled(option)}
                >
                  <ListItemText
                    disableTypography
                    sx={{
                      '& mark': {
                        textDecoration: 'underline',
                        background: 'yellow',
                      },
                      overflow: 'hidden',
                      whiteSpace: 'nowrap',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    <ProjectListItem project={option} search={select.inputValue()} />
                  </ListItemText>
                </ListItemButton>
              )}
            </For>
          </List>
        </Paper>
      </Popper>
    </>
  );
}
