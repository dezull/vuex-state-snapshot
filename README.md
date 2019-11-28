# Vuex State Snapshot

A Vuex plugin to take state snapshot on mutation.

## Installation

```shell
yarn add vuex-state-snapshot
```

## Example

See `examples/` at [Code Sandbox](https://codesandbox.io/s/vuex-state-snapshot-example-cd1f4)

## Usage

Add the plugin to the Vuex *store*:

```javascript
import { createPlugin } from 'vuex-state-snapshot'
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
import { createSnapshotHelpers } from 'vuex-state-snapshot'
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

### Browser/Without Build Tool

Use can use the UMD build in `dist/ ` (which  requires `lodash.cloneDeep`):

```html
<script src="https://unpkg.com/vuex@3.1.2/dist/vuex.min.js"></script>
<script src="https://unpkg.com/lodash-core@4.17.15/distrib/lodash-core.min.js"></script>
<script src="vuex-state-snapshot.umd.min.js"></script>
```
And use `createPlugin` and `createSnapshotHelpers` from the `VuexStateSnapshot` global.

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

### Available Getters and Actions

#### Getters

* `undoable`
* `redoable`
* `undoCount`
* `redoCount`

#### Actions

* `undo`
* `redo`
* `clearUndo` - Clear undo history
* `clearRedo` - Clear redo history
* `clearSnapshots` - Clear both undo and redo histories

## License

Vuex State Snapshot is released under the [MIT License](https://opensource.org/licenses/MIT).
