import Vue from 'vue'
import Vuex from 'vuex'
import { createPlugin } from '@/vuex-state-snapshot'

Vue.use(Vuex)

const PLAYER_MARK = 'X'
const MACHINE_MARK = 'O'

const tictactoe = {
  namespaced: true,

  state: {
    themes: ['light', 'dark'],
    currentTheme: 'light',
    lastBox: null,
    boxes: [
      { row: 0, col: 0, marker: null },
      { row: 0, col: 1, marker: null },
      { row: 0, col: 2, marker: null },
      { row: 1, col: 0, marker: null },
      { row: 1, col: 1, marker: null },
      { row: 1, col: 2, marker: null },
      { row: 2, col: 0, marker: null },
      { row: 2, col: 1, marker: null },
      { row: 2, col: 2, marker: null }
    ],
    playerTurn: true
  },

  mutations: {
    setTheme: (state, theme) => {
      if (state.themes.includes(theme)) state.currentTheme = theme
    },

    setPlayerTurn: (state, isTrue) => { state.playerTurn = isTrue },

    tick: (state, { box, marker }) => {
      box.marker = marker
      state.lastBox = box
    }
  },

  actions: {
    playerTick: ({ getters, state, commit, dispatch }, box) => {
      if (getters.ended || !state.playerTurn) return
      if (box.marker !== null) return
      commit('tick', { box, marker: PLAYER_MARK })
      commit('setPlayerTurn', false)
      dispatch('machineTick')
    },

    machineTick: ({ state, getters, commit }) => {
      if (getters.ended) return
      setTimeout(() => {
        const choices = state.boxes.filter(box => box.marker === null)
        const totalChoices = choices.length
        const box = choices[Math.floor(Math.random() * totalChoices)]
        commit('tick', { box, marker: MACHINE_MARK })
        commit('setPlayerTurn', true)
      }, (Math.random() * 500) + 500)
    }
  },

  getters: {
    findWinner: state => filter => {
      const line = state.boxes.filter(filter)
      if (line.length === 3) return line[0].marker === PLAYER_MARK ? 'You' : 'Machine'
      return null
    },

    winner: (state, getters) => {
      const box = state.lastBox
      if (!box) return null

      // horizonal
      let winner = getters.findWinner(b => b.row === box.row && b.marker === box.marker)
      // vertical
      winner = winner || getters.findWinner(b => b.col === box.col && b.marker === box.marker)
      // diagonal
      winner = winner || getters.findWinner(b => b.col === b.row && b.marker === box.marker)
      winner = winner || getters.findWinner(b => b.col + b.row === 2 && b.marker === box.marker)

      return winner
    },

    ended: (state, getters) => !!getters.winner || !state.boxes.filter(b => b.marker === null).length
  }
}

export default new Vuex.Store({
  modules: { tictactoe },
  strict: process.env.NODE_ENV !== 'production',
  plugins: [createPlugin({
    tictactoe: {
      shouldSnapshot: (state, mutation) => ['setPlayerTurn'].includes(mutation.type),
      includeState: (state, key) => key !== 'currentTheme'
    }
  })]
})
