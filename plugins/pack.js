async function define(id, using, lazy, mapping) {
  if(globalThis.define && globalThis.define !== define) {
    return globalThis.define(id, using, lazy, mapping)
  } else {
    globalThis.define = Object.assign(define, {
      url: import.meta.url,
      loading: {},
      instances: {}, 
    })
  }
  
  const { url, loading, instances } = globalThis.define
  
  function load(path) {
    const { href } = new URL(path, url)
    if(loading[href]) return loading[href]
    return loading[href] = import(href).then(async fragment => {
      return Object.assign(mapping, await fragment.default)
    })
  }

  const uses = Object.values(using).map(load)

  if(uses.length) {
    const mappings = await Promise.all(uses)
    for(const map of mappings) {
      Object.assign(mapping, map)
    }
  }

  function create(id) {
    if(instances[id]) return instances[id]
    const [ deps, factory, defer = {} ] = mapping[id]
    const module = { exports: instances[id] = {} }
    function require(local) {
      const id = deps[local]
      if(mapping[id]) return create(id)
      return load(lazy[defer[id]]).then(() => {
        return create(deps[id])
      })
    }
    factory(require, module, module.exports)

    return instances[id] = module.exports
  }

  create(id)

  return mapping
}

function createBundle(bundle, pending, bundles, rename) {
  if(bundles[bundle.id]) return bundle

  const { graph, using: uses, lazy: defer } = bundles[bundle.id] = bundle
  const using = {}
  const lazy = {}

  for(const id of Object.keys(uses)) {
    const { url } = createBundle(pending[id], pending, bundles, rename)

    using[id] = url
  }
  for(const id of Object.keys(defer)) {
    const { url } = createBundle(pending[id], pending, bundles, rename)

    lazy[id] = url
  }

  const fragments = JSON.stringify(using||{})
  const deferred = JSON.stringify(lazy||{})

  const entries = Object.values(graph)
    .map(entry => {
      const id = JSON.stringify(entry.id)
      const deps = JSON.stringify(entry.deps || [])
      const lazy = JSON.stringify(entry.lazy || {})
      const create = `function (require, module, exports) {\n${entry.source}\n}`
      return `${id}:[${deps}, ${create}, ${lazy}]`
    })
    .join(',\n')

  bundle.source = `export default (${define}(
    ${bundle.id},
    ${fragments}, 
    ${deferred}, 
    {${entries}}
  ))`

  if(rename) {
    bundle.url = rename(bundle)
  }

  return bundle
}

export default function wrap({ rename } = {}) {
  return async function* pack(input) {
    const pending = {}
    const bundles = {}

    for await (const bundle of input) {
      pending[bundle.id] = bundle
    }

    for(const bundle of Object.values(pending)) {
      yield createBundle(bundle, pending, bundles, rename)
    }
  }
}