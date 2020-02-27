import { Worker } from 'worker_threads'

export default function babel(options = {}) {
  const source = new URL('./babel/worker.js', import.meta.url)

  return async function* babelTransform (input) {
    const worker = new Worker(source.pathname, { type: 'module' })
    const resolvers = { } 

    worker.on('message', ({ url, source, error, dependency, local, lazy }) => {
      const { asset, resolve, reject } = resolvers[url]

      if(dependency) {
        asset.add(dependency, { local, lazy })
      } else if(error) {
        reject(error)
      } else {
        asset.source = source
        resolve(asset)
      }
    })

    worker.postMessage({ options })

    for await (const asset of input) {
      if(!asset) continue

      const { url, source } = asset

      const promise = new Promise((resolve, reject) => {
        resolvers[url] = { asset, resolve, reject }
      })
      
      worker.postMessage({ url, source })
      
      yield promise
    }
    worker.terminate()
  }
}