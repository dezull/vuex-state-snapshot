<template>
  <div id="app">
    <TicTacToe />
    <button
      :disabled="!undoable"
      @click="undo"
    >
      undo ({{ undoCount }})
    </button>
    <button
      :disabled="!redoable"
      @click="redo"
    >
      redo ({{ redoCount }})
    </button>
  </div>
</template>

<script>
import { createSnapshotHelpers } from '@/vuex-snapshot'
import TicTacToe from './components/TicTacToe.vue'

const snapshot = createSnapshotHelpers('tictactoe')

export default {
  name: 'App',
  components: { TicTacToe },

  computed: {
    ...snapshot.mapGetters(['undoable', 'redoable', 'undoCount', 'redoCount'])
  },

  methods: {
    ...snapshot.mapActions(['undo', 'redo'])
  }
}
</script>

<style>
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
