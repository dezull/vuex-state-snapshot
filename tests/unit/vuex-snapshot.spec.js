import { createLocalVue, shallowMount } from '@vue/test-utils'
import Vuex, { createNamespacedHelpers, mapMutations } from 'vuex'

// Under test
import { createPlugin, createSnapshotHelpers } from '@/vuex-snapshot'

describe.each([
  ['namespaced module', 'one', 'one'],
  ['namespaced module under namespaced module', 'one/one_a', 'one_a'],
  ['namespaced module under non-namespaced module', 'two_b', 'two_b']
])('VuexSnapshot', (description, namespace, initialValue) => {
  describe(description, () => {
    it('sets initial states', () => {
      const vm = createApp(namespace).vm
      expect(vm.undoable).toBe(false)
      expect(vm.redoable).toBe(false)
      expect(vm.undoCount).toBe(0)
      expect(vm.redoCount).toBe(0)
    })

    it("doesn't track unregistered mutation", () => {
      const vm = createApp(namespace).vm
      vm.setUnique('abc')
      expect(vm.undoCount).toBe(0)
      expect(vm.redoCount).toBe(0)
    })

    it('becomes undoable on mutation', () => {
      const vm = createApp(namespace).vm
      expect(vm.value).toBe(initialValue)
      vm.setValue('abc')
      expect(vm.undoable).toBe(true)
      expect(vm.undoCount).toBe(1)
      expect(vm.redoable).toBe(false)
      expect(vm.redoCount).toBe(0)
    })

    it('is undoable multiple times', () => {
      const vm = createApp(namespace).vm
      vm.setValue('abc')
      vm.setValue('def')
      expect(vm.undoable).toBe(true)
      expect(vm.undoCount).toBe(2)
    })

    it('undoes', () => {
      const vm = createApp(namespace).vm
      vm.setValue('abc')
      vm.setValue('def')
      vm.undo()
      expect(vm.value).toBe('abc')
      expect(vm.undoCount).toBe(1)
      expect(vm.redoCount).toBe(1)
    })

    it('becomes redoable on undo', () => {
      const vm = createApp(namespace).vm
      vm.setValue('abc')
      vm.undo()
      expect(vm.redoable).toBe(true)
      expect(vm.redoCount).toBe(1)
      expect(vm.undoable).toBe(false)
      expect(vm.undoCount).toBe(0)
    })

    it('is redoable multiple times', () => {
      const vm = createApp(namespace).vm
      vm.setValue('abc')
      vm.setValue('def')
      vm.undo()
      vm.undo()
      expect(vm.redoable).toBe(true)
      expect(vm.redoCount).toBe(2)
    })

    it('redoes', () => {
      const vm = createApp(namespace).vm
      vm.setValue('abc')
      vm.setValue('def')
      expect(vm.undoCount).toBe(2)
      expect(vm.redoCount).toBe(0)
      vm.undo()
      expect(vm.undoCount).toBe(1)
      expect(vm.redoCount).toBe(1)
      expect(vm.value).toBe('abc')
      vm.redo()
      expect(vm.value).toBe('def')
      expect(vm.undoCount).toBe(2)
      expect(vm.redoCount).toBe(0)
    })

    it('clears redo on mutation', () => {
      const vm = createApp(namespace).vm
      vm.setValue('abc')
      vm.undo()
      expect(vm.redoable).toBe(true)
      expect(vm.redoCount).toBe(1)

      vm.setValue('def')
      expect(vm.redoable).toBe(false)
      expect(vm.redoCount).toBe(0)
    })

    it('changes after undoes', () => {
      const vm = createApp(namespace).vm
      vm.setValue('abc')
      vm.setValue('def')
      vm.undo()
      vm.setValue('ghi')
      vm.undo()
      expect(vm.value).toBe('abc')
      vm.redo()
      expect(vm.value).toBe('ghi')
      expect(vm.undoCount).toBe(2)
      expect(vm.redoCount).toBe(0)
    })

    it('includes states by callback', () => {
      const vm = createApp(namespace, {
        includeState: (state, name) => name === 'value'
      }).vm
      vm.setValue('abc')
      expect(vm.undoCount).toBe(1)
      vm.setExcluded('ignore undo')
      expect(vm.undoCount).toBe(2)
      expect(vm.value).toBe('abc')
      expect(vm.excluded).toBe('ignore undo')
      vm.undo()
      expect(vm.value).toBe('abc')
      expect(vm.excluded).toBe('ignore undo')
      vm.undo()
      expect(vm.value).toBe(initialValue)
      expect(vm.excluded).toBe('ignore undo')
      expect(vm.undoCount).toBe(0)
    })

    it('includes mutations by callback', () => {
      const vm = createApp(namespace, {
        shouldSnapshot: (state, mutation) => mutation.type === 'setValue'
      }).vm
      vm.setValue('abc')
      expect(vm.undoCount).toBe(1)
      vm.clearValue()
      expect(vm.undoCount).toBe(1)
      expect(vm.value).toBe('')
      vm.undo()
      expect(vm.undoCount).toBe(0)
      expect(vm.value).toBe(initialValue)
    })
  })
})

function createComponent (namespace) {
  const helpers = createNamespacedHelpers(namespace)
  const snapshot = createSnapshotHelpers(namespace)

  return {
    template: '<div></div>',
    computed: {
      ...helpers.mapState(['value', 'excluded']),
      ...snapshot.mapGetters(['undoable', 'redoable', 'undoCount', 'redoCount'])
    },
    methods: {
      ...mapMutations(['setUnique']),
      ...helpers.mapMutations(['setValue', 'clearValue', 'setExcluded']),
      ...snapshot.mapActions(['undo', 'redo'])
    }
  }
}

function createStore (plugin) {
  return new Vuex.Store({
    state: { unique: null },
    mutations: {
      setUnique: (state, payload) => { state.unique = payload }
    },
    modules: {
      // one(namespaced)
      // one(namespaced)/one_a(namespaced)
      one: {
        namespaced: true,
        state: { value: 'one', exclude: 'ignore one' },
        mutations: {
          setValue: (state, payload) => { state.value = payload },
          clearValue: (state) => { state.value = '' },
          setExcluded: (state, payload) => { state.excluded = payload }
        },
        modules: {
          one_a: {
            namespaced: true,
            state: { value: 'one_a', exclude: 'ignore one_a' },
            mutations: {
              setValue: (state, payload) => { state.value = payload },
              clearValue: (state) => { state.value = '' },
              setExcluded: (state, payload) => { state.excluded = payload }
            }
          }
        }
      },
      // two(non-namespaced)
      // two(non-namespaced)/two_a(non-namespaced)
      // two(non-namespaced)/two_b(namespaced)
      two: {
        state: { value: 'two', exclude: 'ignore two' },
        mutations: {
          setValue: (state, payload) => { state.value = payload },
          clearValue: (state) => { state.value = '' },
          setExcluded: (state, payload) => { state.excluded = payload }
        },
        modules: {
          two_a: {
            state: { value: 'two_a', exclude: 'ignore two_a' },
            mutations: {
              setValue: (state, payload) => { state.value = payload },
              clearValue: (state) => { state.value = '' },
              setExcluded: (state, payload) => { state.excluded = payload }
            }
          },
          two_b: {
            namespaced: true,
            state: { value: 'two_b', exclude: 'ignore two_b' },
            mutations: {
              setValue: (state, payload) => { state.value = payload },
              clearValue: (state) => { state.value = '' },
              setExcluded: (state, payload) => { state.excluded = payload }
            }
          }
        }
      }
    },
    plugins: [plugin]
  })
}

function createApp (namespace = null, pluginOptions = {}) {
  const localVue = createLocalVue()
  localVue.use(Vuex)

  const store = createStore(createPlugin({
    'one': pluginOptions,
    'one/one_a': pluginOptions,
    'two_b': pluginOptions
  }))

  return shallowMount(createComponent(namespace), {
    localVue,
    store
  })
}
