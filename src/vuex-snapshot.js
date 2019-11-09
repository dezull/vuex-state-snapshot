import cloneDeep from 'lodash/cloneDeep'
import { createNamespacedHelpers } from 'vuex'

const PLUGIN_NAME = 'vuexsnapshot'
const DONES = 'dones'
const UNDONES = 'undones'
const MUTATION_TAG = `__${PLUGIN_NAME}__`

const VuexSnapshot = class {
  constructor (store, moduleOptions) {
    this.store = store
    this.moduleOptions = moduleOptions
    this.moduleNames = Object.keys(moduleOptions)
    this.rootModule = store._modules.root

    // Keep track of the previous state change, to push into 'dones' stack when the state changes
    this.previousDones = {}
  }

  mutationPayload (payload) {
    return Object.assign({}, payload, { [MUTATION_TAG]: true })
  }

  denamespaceMutation (mutation) {
    return { ...mutation, type: mutation.type.replace(/^.+\//, '') }
  }

  namespaceFromMutation (mutation) {
    return mutation.type.split('/').slice(0, -1).join('/')
  }

  stateName (module, name) {
    return `${module}_${name}`
  }

  findNamespacedModule (namespace, moduleTree = this.rootModule) {
    const parts = namespace.split('/')
    if (!parts.length) return false

    const subtree = moduleTree._children[parts[0]]
    const subpath = parts.slice(1).join('/')
    if (subtree && subtree.namespaced) {
      return parts.length === 1 ? subtree : this.findNamespacedModule(subpath, subtree)
    } else {
      for (const name in moduleTree._children) {
        const module = this.findNamespacedModule(namespace, moduleTree._children[name])
        if (module) return module
      }
    }

    return false
  }

  takeSnapshot (module, moduleState) {
    this.store.dispatch(`${PLUGIN_NAME}/snapshot`, { module, moduleState, [MUTATION_TAG]: true })
  }

  takeSnapshotFromMutation (mutation) {
    // Ignore this plugin's mutation
    if (mutation.payload && mutation.payload[MUTATION_TAG]) return

    for (const namespace in this.moduleOptions) {
      if (this.namespaceFromMutation(mutation) !== namespace) continue
      const moduleState = this.findNamespacedModule(namespace, this.rootModule).state
      const moduleMutation = this.denamespaceMutation(mutation)
      const moduleConfig = this.moduleOptions[namespace]
      let subscribeModule = false

      if (moduleConfig) {
        subscribeModule = moduleConfig && moduleConfig.shouldSnapshot
          ? moduleConfig.shouldSnapshot(moduleState, moduleMutation)
          : true
      }

      if (subscribeModule) this.takeSnapshot(namespace, moduleState)
    }
  }

  takeAllSnapshots () {
    this.moduleNames.forEach(namespace => {
      const module = this.findNamespacedModule(namespace, this.rootModule)
      if (module) this.takeSnapshot(namespace, module.state)
    })
  }

  registerPluginModule () {
    const state = this.moduleNames.reduce((memo, name) => {
      memo[this.stateName(name, DONES)] = []
      memo[this.stateName(name, UNDONES)] = []

      return memo
    }, {})

    this.store.registerModule(PLUGIN_NAME, {
      namespaced: true,
      state,

      mutations: {
        // push state snapshot to DONES/UNDONES stack
        pushStack: (state, { module, snapshot, stack }) => {
          return state[this.stateName(module, stack)].push(snapshot)
        },

        // pop snapshot from DONES/UNDONES stack and set to module state
        popStack: (state, { module, stack }) => {
          const snapshot = state[this.stateName(module, stack)].pop()
          const moduleState = this.findNamespacedModule(module, this.rootModule).state
          const includeState = this.moduleOptions[module].includeState

          for (const key in snapshot) {
            if (includeState ? includeState(moduleState, key) : true) {
              moduleState[key] = cloneDeep(snapshot[key])
            }
          }
        },

        clearStack: (state, { module, stack }) => { state[this.stateName(module, stack)] = [] }
      },

      actions: {
        undo: ({ dispatch }, { module }) => dispatch('do', { module, stack: DONES }),
        redo: ({ dispatch }, { module }) => dispatch('do', { module, stack: UNDONES }),

        do: ({ commit, state }, { module, stack }) => {
          const inverse = stack === DONES ? UNDONES : DONES
          if (!state[this.stateName(module, stack)].length) return
          const moduleState = this.findNamespacedModule(module, this.rootModule).state
          commit('pushStack', this.mutationPayload({ module, stack: inverse, snapshot: cloneDeep(moduleState) }))
          commit('popStack', this.mutationPayload({ stack: stack, module }))
          this.previousDones[module] = cloneDeep(moduleState)
        },

        snapshot: ({ commit, state }, { module, moduleState }) => {
          const stateSnapshot = cloneDeep(moduleState)
          if (this.previousDones[module]) {
            commit('pushStack',
              this.mutationPayload({ module, stack: DONES, snapshot: this.previousDones[module] }))
          }
          this.previousDones[module] = stateSnapshot
          commit('clearStack', this.mutationPayload({ module, stack: UNDONES }))
        }
      },

      getters: {
        undoable: (state, getters) => module => getters.undoCount(module) > 0,
        redoable: (state, getters) => module => getters.redoCount(module) > 0,
        undoCount: state => module => state[this.stateName(module, DONES)].length,
        redoCount: state => module => state[this.stateName(module, UNDONES)].length
      }
    })
  }
}

export function createSnapshotHelpers (namespace) {
  const helpers = createNamespacedHelpers(PLUGIN_NAME)
  const mapHelpers = (mapper, arg, transform) => {
    const nsHelpers = mapper(arg)
    const mappedHelpers = {}
    for (const name in nsHelpers) {
      mappedHelpers[name] = transform(nsHelpers[name], namespace)
    }

    return mappedHelpers
  }

  return {
    mapGetters (arg) {
      return mapHelpers(helpers.mapGetters, arg, (getter, namespace) => {
        return function () { return getter.call(this)(namespace) }
      })
    },

    mapActions (arg) {
      return mapHelpers(helpers.mapActions, arg, (action, namespace) => {
        return function () { return action.call(this, { module: namespace }) }
      })
    }
  }
}

export function createPlugin (modules) {
  return store => {
    const plugin = new VuexSnapshot(store, modules)
    if (!plugin.moduleNames.length) {
      throw new Error('Must specify modules to snapshot when initializing VuexSnapshot')
    }
    plugin.registerPluginModule()
    plugin.takeAllSnapshots()

    // susbcribe callback is called after mutation, so we take snapshot of previous state after each call
    store.subscribe((mutation, state) => plugin.takeSnapshotFromMutation(mutation))
  }
}
