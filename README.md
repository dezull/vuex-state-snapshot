# Vuex Snapshot

A Vuex plugin to take state snapshot on mutation.

## Installation

```shell
yarn add vuex-state-snapshot
```

## Example

See `examples/` or at [Code Sandbox](https://codesandbox.io/s/vuex-state-snapshot-example-cd1f4)

## Usage

Add the plugin to the Vuex *store*:

```javascript
const store = new Vuex.Store({
  modules: {
    yourModuleNamespace: {
        namespaced: true,
        ...
    }
  },
  plugins: [createPlugin({
    yourModuleNamespace: { /* see Module Options below */ }
  })]
})
```

In *component*, use `createSnapshotHelpers` to map the helpers:

```javascript
import { createSnapshotHelpers } from 'vuex-snapshot'
const snapshot = createSnapshotHelpers('yourModuleNamespace')

export default {
  name: 'App',

  computed: {
    ...snapshot.mapGetters(['undoable', 'redoable', 'undoCount', 'redoCount'])
  },

  methods: {
    ...snapshot.mapActions(['undo', 'redo'])
  }
}
```

### Module Options

Options are callbacks with the namespaced `state` as argument, so you could delegate it back to your state.

#### includeState

Callback to decide to include the state during undo/redo, eg: ID, untracked UI state:

```javascript
(state, key) => !state.irreversibleStates.includes(key)
```

#### shouldSnapshot

Callback to decide to track the mutation, eg: mutation to toggle UI element visibility. `mutation.type` is un-namespaced:

```javascript
(state, mutation) => state.trackedMutations.includes(mutation.type)
```
