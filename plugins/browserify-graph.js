async function generateGraph(entry, graph = {}) {
  if(graph[entry.url]) return graph

  const mappings = graph[entry.url] = {
    id: entry.url,
    source: entry.source,
    deps: { }
  }

  if(entry.entry) {
    mappings.entry = entry.entry
  }

  for(const [ local, asset ] of Object.entries(entry.dependencies)) {
    const module = await asset.module

    mappings.deps[local] = module.url

    await generateGraph(module, graph)
  }

  return graph
}

export default function createGraph() {
  return async function* graph(input) {
    const entries = []
    
    for await(const asset of input) {
      asset.module.resolve(asset)

      if(asset.entry) {
        entries.push(asset)
      }
    }
    for(const entry of entries) {
      yield [ entry, await generateGraph(await entry) ]
    }
  }
}