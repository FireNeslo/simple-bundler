import bundler from '../index.js'
import resolve from '../plugins/resolve.js'
import loader from '../plugins/loader.js'
import babel from '../plugins/babel.js'
import graph from '../plugins/browserify-graph.js'
import json from '../plugins/json.js'
import stub from '../plugins/stub.js'

const bundle = bundler([
  stub({
    events: `
      import * as events from '@ungap/event-target'
      console.log(events, globalThis);
      export const EventEmitter = globalThis.EventTarget
    `
  }),
  resolve({ base: import.meta.url }),
  loader(),
  json(),
  babel(),
  graph()
])


bundle.add('./source/index.js')

void async function main() {
  for await(const [ asset, mappings ] of bundle) {
    console.log(JSON.stringify(mappings))
  }
}()
