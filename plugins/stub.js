function test(id, expression) {
  if(typeof expression === 'string') {
    return id === expression
  } else {
    return expression.test(id)
  }
}

export default function createStub(expressions) {
  if(!Array.isArray(expressions)) {
    expressions = Object.entries(expressions)
  }

  function applyStub(asset) {
    for(const item of expressions) {
      const [ expression, source ] = Array.isArray(item) ? item : [ item, ';' ]

      if(test(asset.url, expression)) {
        asset.url = asset.url
        asset.source = source
        return asset
      }
    }
    return asset
  }
  
  return async function *stub(input) {
    for await(const asset of input) {
      yield applyStub(asset)
    }
  }
}