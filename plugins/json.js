export default function jsonLoader() {
  return async function *json(input) {
    for await(const asset of input) {
      if(asset.url.endsWith('.json')) {
        asset.source = `module.exports = ${asset.source}`
      }
      yield asset
    }
  }
}