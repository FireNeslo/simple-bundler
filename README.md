simple-bundler
==============

A simple build pipeline builder for bundling.

## Usage

```js
import bundler from '../index.js'
import resolve from '../plugins/resolve.js'
import loader from '../plugins/loader.js'
import babel from '../plugins/babel.js'
import graph from '../plugins/browserify-graph.js'

// setup plugins
const bundle = bundler([
  resolve({ base: import.meta.url }),
  loader(),
  babel(),
  graph()
])


bundle.add('./source/index.js')

void async function main() {
  for await(const [ asset, mappings ] of bundle) {
    console.log(JSON.stringify(mappings)) // generated graph
  }
}()
```

## Demo

```sh
$ npm i -g browser-pack
```

```sh
$ node demo/index.js | browser-pack > app.js
```
