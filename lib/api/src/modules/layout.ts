import { document } from 'global';
import pick from 'lodash/pick';

import deepEqual from 'fast-deep-equal';

import { themes, ThemeVars } from '@storybook/theming';
import merge from '../lib/merge';
import { State, ModuleFn } from '../index';

export type PanelPositions = 'bottom' | 'right';
export type ActiveTabsType = 'sidebar' | 'canvas' | 'addons';
export const ActiveTabs = {
  SIDEBAR: 'sidebar' as 'sidebar',
  CANVAS: 'canvas' as 'canvas',
  ADDONS: 'addons' as 'addons',
};

export interface Layout {
  initialActive: ActiveTabsType;
  isFullscreen: boolean;
  showPanel: boolean;
  panelPosition: PanelPositions;
  showNav: boolean;
  isToolshown: boolean;
}

export interface UI {
  name?: string;
  url?: string;
  enableShortcuts: boolean;
  sidebarAnimations: boolean;
  docsMode: boolean;
}

export interface SubState {
  layout: Layout;
  ui: UI;
  selectedPanel: string | undefined;
  theme: ThemeVars;
}

export interface SubAPI {
  toggleFullscreen: (toggled?: boolean) => void;
  togglePanel: (toggled?: boolean) => void;
  togglePanelPosition: (position?: PanelPositions) => void;
  toggleNav: (toggled?: boolean) => void;
  toggleToolbar: (toggled?: boolean) => void;
  setOptions: (options: any) => void;
}

type PartialSubState = Partial<SubState>;
type PartialThemeVars = Partial<ThemeVars>;
type PartialLayout = Partial<Layout>;

export interface UIOptions {
  name?: string;
  url?: string;
  goFullScreen: boolean;
  showStoriesPanel: boolean;
  showAddonPanel: boolean;
  addonPanelInRight: boolean;
  theme?: ThemeVars;
  selectedPanel?: string;
}

interface OptionsMap {
  [key: string]: string;
}

const defaultState: SubState = {
  ui: {
    enableShortcuts: true,
    sidebarAnimations: true,
    docsMode: false,
  },
  layout: {
    initialActive: ActiveTabs.SIDEBAR,
    isToolshown: true,
    isFullscreen: false,
    showPanel: true,
    showNav: true,
    panelPosition: 'bottom',
  },
  selectedPanel: undefined,
  theme: themes.light,
};

export const focusableUIElements = {
  storySearchField: 'storybook-explorer-searchfield',
  storyListMenu: 'storybook-explorer-menu',
  storyPanelRoot: 'storybook-panel-root',
};

export const init: ModuleFn = ({ store, provider }) => {
  const api = {
    toggleFullscreen(toggled?: boolean) {
      return store.setState(
        (state: State) => {
          const value = typeof toggled === 'boolean' ? toggled : !state.layout.isFullscreen;

          return {
            layout: {
              ...state.layout,
              isFullscreen: value,
            },
          };
        },
        { persistence: 'session' }
      );
    },

    togglePanel(toggled?: boolean) {
      return store.setState(
        (state: State) => {
          const value = typeof toggled !== 'undefined' ? toggled : !state.layout.showPanel;

          return {
            layout: {
              ...state.layout,
              showPanel: value,
            },
          };
        },
        { persistence: 'session' }
      );
    },

    togglePanelPosition(position?: 'bottom' | 'right') {
      if (typeof position !== 'undefined') {
        return store.setState(
          (state: State) => ({
            layout: {
              ...state.layout,
              panelPosition: position,
            },
          }),
          { persistence: 'session' }
        );
      }

      return store.setState(
        (state: State) => ({
          layout: {
            ...state.layout,
            panelPosition: state.layout.panelPosition === 'right' ? 'bottom' : 'right',
          },
        }),
        { persistence: 'session' }
      );
    },

    toggleNav(toggled?: boolean) {
      return store.setState(
        (state: State) => {
          const value = typeof toggled !== 'undefined' ? toggled : !state.layout.showNav;

          return {
            layout: {
              ...state.layout,
              showNav: value,
            },
          };
        },
        { persistence: 'session' }
      );
    },

    toggleToolbar(toggled?: boolean) {
      return store.setState(
        (state: State) => {
          const value = typeof toggled !== 'undefined' ? toggled : !state.layout.isToolshown;

          return {
            layout: {
              ...state.layout,
              isToolshown: value,
            },
          };
        },
        { persistence: 'session' }
      );
    },

    resetLayout() {
      return store.setState(
        (state: State) => {
          return {
            layout: {
              ...state.layout,
              showNav: false,
              showPanel: false,
              isFullscreen: false,
            },
          };
        },
        { persistence: 'session' }
      );
    },

    focusOnUIElement(elementId?: string) {
      if (!elementId) {
        return;
      }
      const element = document.getElementById(elementId);
      if (element) {
        element.focus();
      }
    },

    getInitialOptions() {
      const { theme, selectedPanel, ...options } = provider.getConfig();

      return {
        ...defaultState,
        layout: {
          ...defaultState.layout,
          ...pick(options, Object.keys(defaultState.layout)),
        },
        ui: {
          ...defaultState.ui,
          ...pick(options, Object.keys(defaultState.ui)),
        },
        selectedPanel: selectedPanel || defaultState.selectedPanel,
        theme: theme || defaultState.theme,
      };
    },

    setOptions: (options: any) => {
      const { layout, ui, selectedPanel, theme } = store.getState();

      if (options) {
        const updatedLayout = {
          ...layout,
          ...pick(options, Object.keys(layout)),
        };

        const updatedUi = {
          ...ui,
          ...pick(options, Object.keys(ui)),
        };

        const updatedTheme = {
          ...theme,
          ...options.theme,
        };

        const modification: PartialSubState = {};

        if (!deepEqual(ui, updatedUi)) {
          modification.ui = updatedUi;
        }
        if (!deepEqual(layout, updatedLayout)) {
          modification.layout = updatedLayout;
        }
        if (options.selectedPanel && !deepEqual(selectedPanel, options.selectedPanel)) {
          modification.selectedPanel = options.selectedPanel;
        }

        if (Object.keys(modification).length) {
          store.setState(modification, { persistence: 'permanent' });
        }
        if (!deepEqual(theme, updatedTheme)) {
          store.setState({ theme: updatedTheme });
        }
      }
    },
  };

  const persisted = pick(store.getState(), 'layout', 'ui', 'selectedPanel');

  return { api, state: merge(api.getInitialOptions(), persisted) };
};
