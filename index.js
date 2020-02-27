function defer(resolve, reject) {
  return Object.assign(new Promise((ok, no) => (resolve = ok, reject = no)), { resolve, reject })
}

function createPipeline(pipeline, plugin) {
  return plugin.call(this, pipeline)
}
class Asset {
  constructor({ url, parent, bundler, entry, lazy }) {
    this.url = url
    this.lazy = lazy
    this.entry = entry
    this.parent = parent
    this.bundler = bundler
    this.dependencies = {}
    this.module = defer()
  }

  async add(id, opts = { entry: false }) {
    const local = opts.local != null ? opts.local : id
    return this.dependencies[local] = this.bundler.add(id, this, opts)
  }
}

async function* entries(bundle) {
  for(const asset of bundle.assets) {
    yield asset
  }
}

class Bundle {
  constructor(plugins) {
    this.assets = []
    this.plugins = plugins
  }

  add(url, parent, opts = { entry: true }) {
    const asset = new Asset({ url, bundler: this, parent, ...opts })
    this.assets.push(asset)
    return asset
  }

  async *[Symbol.asyncIterator]() {
    const { plugins } = this

    const pipeline = plugins.reduce(createPipeline, entries(this), this)

    for await(const output of pipeline) {
      yield output
    }
  }
}

export default function bundler(plugins) {
  return new Bundle(plugins)
}