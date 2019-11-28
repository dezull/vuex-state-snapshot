import resolve from 'rollup-plugin-node-resolve'
import commonjs from 'rollup-plugin-commonjs'
import babel from 'rollup-plugin-babel'
import { terser } from 'rollup-plugin-terser'
import pkg from './package.json'

const input = 'src/vuex-state-snapshot.js'
const external = ['vue', 'vuex', 'lodash/cloneDeep']
const outputPath = `dist/${pkg.name}`
const globals = {
  'lodash/cloneDeep': '_.cloneDeep',
  vuex: 'Vuex'
}

export default [
  {
    input,
    external,
    output: [
      {
        name: 'VuexStateSnapshot',
        globals,
        file: `${outputPath}.umd.js`,
        format: 'umd'
      },
      {
        name: 'VuexStateSnapshot',
        sourcemap: true,
        globals,
        file: `${outputPath}.umd.min.js`,
        format: 'umd'
      }
    ],
    plugins: [
      resolve(),
      commonjs(),
      terser({
        include: [/^.+\.min\.js$/]
      }),
      babel({ runtimeHelpers: true })
    ]
  }
]
