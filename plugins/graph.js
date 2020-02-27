class Bundle {
  constructor({ id, url, graph, using, lazy, entry }) {
    this.id = id
    this.url = url
    this.graph = graph
    this.using = using
    this.lazy = lazy
    this.entry = entry
  }
} 

function* createBundles(fragments, assets, rename) {
  const entries = Object.values(fragments)
  const mapping = {}

  for(const files of entries) {
    for(const graph of Object.values(fragments)) {
      let shared = null
      let id = null
      for(const node of Object.values(files)) {
        if(id == null) id = node.id
        if(graph[node.id]) {
          if(!shared) {
            fragments[id = node.id] = shared = {}
          }
  
          shared[node.id] = node
  
          delete files[node.id]
          delete graph[node.id]  
        }
        mapping[node.id] = id
      }
    }
  }

  for(const [ id, graph ] of Object.entries(fragments)) {
    const entry = assets[id]
    const using = {}
    const lazy = {}

    const url = (entry.url||'index.js').split('/').pop()

    for(const node of Object.values(graph)) {
      const lazyMap = node.lazy || {}

      for(const dependency of node.deps) {
        const bundle = mapping[dependency]

        if(bundle == id) continue

        if(lazyMap[dependency] != null) {
          lazy[bundle] = lazyMap[dependency] = bundle
        } else {
          using[bundle] = bundle
        }
      }
    }
  
    yield new Bundle({ id, url, graph, using, lazy, entry })
  }
}

async function createFragment(asset, graph) {
  const { id, source, dependencies } = asset

  if(graph[id]) return graph

  const node = graph[id] = { id, source, deps: [] }

  const pending = Object.entries(dependencies)
    .map(async ([local, dependency]) => {
      const asset = await dependency.module

      node.deps[local] = asset.id

      if(dependency.lazy) {
        if(!node.lazy) {
          node.lazy = {}
        }
        node.lazy[asset.id] = 0
      }

      return createFragment(asset, graph)
    })
  
  await Promise.all(pending)

  return graph
}

export default function graph({ rename } = {}) {
  return async function* graph(input) {
    let index = 0

    const fragments = {}
    const assets = {}
    const pending = []
    
    for await(const asset of input) {
      asset.id = index++
      asset.module.resolve(asset)

      assets[asset.id] = asset

      if(asset.entry || asset.lazy) {
        const fragment = fragments[asset.id] = { }
        pending.push(createFragment(asset, fragment))
      }
    }

    await Promise.all(pending)
    
    yield* createBundles(fragments, assets, rename)
  }
}