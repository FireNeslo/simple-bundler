export default function createAlias(map) {
  return async function *alias(input) {
    for await(const asset of input) {
      if(map[asset.url]) {
        asset.url = map[asset.url]
      }
      yield asset
    }
  }
}