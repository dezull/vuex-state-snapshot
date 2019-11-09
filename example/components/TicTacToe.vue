<template>
  <div>
    <select
      :value="currentTheme"
      @change="setTheme($event.target.value)"
    >
      <option
        v-for="theme in themes"
        :key="theme"
        :value="theme"
      >
        {{ theme }}
      </option>
    </select>
    <p class="message">
      {{ message }}
    </p>
    <div
      class="boxes"
      :class="[cursorClass, themeClass]"
    >
      <div
        v-for="box in boxes"
        :key="box.row.toString() + box.col"
        class="box"
        :class="box.marker && 'cursor-not-allowed'"
        @click="playerTick(box)"
      >
        <span>{{ box.marker }}</span>
      </div>
    </div>
    <div class="clearfix" />
  </div>
</template>

<script>
import { createNamespacedHelpers } from 'vuex'
const { mapState, mapMutations, mapActions, mapGetters } = createNamespacedHelpers('tictactoe')

export default {
  computed: {
    ...mapState(['themes', 'currentTheme', 'boxes', 'playerTurn']),
    ...mapGetters(['winner', 'ended']),

    message () {
      if (this.ended) return this.winner ? `${this.winner} won!` : 'Draw!'
      return this.playerTurn ? 'Your turn' : 'Machine is thinking...'
    },

    themeClass () { return 'theme-' + this.currentTheme },

    cursorClass () {
      if (this.ended) return 'cursor-ended'
      return this.playerTurn ? '' : 'cursor-wait'
    }
  },

  methods: {
    ...mapMutations(['setTheme']),
    ...mapActions(['playerTick'])
  }
}
</script>

<style>
.cursor-wait {
  cursor: wait;
}

.cursor-not-allowed, .cursor-ended {
  cursor: not-allowed;
}

.boxes {
  display: inline-block;
  border: 5px solid black;
}

.box {
  font-family: 'Avenir', 'Helvetica', 'Arial', sans-serif;
  border: 1px solid black;
  width: 40px;
  height: 40px;
  padding: 30px;
  float: left;
  margin-top: -1px;
  margin-left: -1px;
  text-align: center;
  font-size: 40px;
  line-height: 40px;
}

.box:nth-child(3n + 1), .clearfix {
  clear: both;
}

.theme-dark {
  color: white;
  background: #263238;
}

.theme-dark .box {
  border-color: white;
}
</style>
