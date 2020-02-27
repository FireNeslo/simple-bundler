function defaultBase() {
  return location.href
}

export default function resolve({ base = defaultBase(), packages = 'https://unpkg.com' } = {}) {
  return async function* resolver(input) {
    const dedupe = {}
    
    for await(const asset of input) {
      if(asset.url[0] !== '.') {
        if(packages) {
          asset.url = new URL(asset.url, packages).href
        }
      } else {
        const root = asset.parent ? asset.parent.url : base

        asset.url = new URL(asset.url, root).href
      }

      if(dedupe[asset.url]) {
        asset.module.resolve(dedupe[asset.url])
      } else {
        yield dedupe[asset.url] = asset
      }
    }
  }
}