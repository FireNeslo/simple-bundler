import reval from 'https://cdn.statically.io/gh/FireNeslo/fn-reval/58481020/index.js'

Promise.all([
  import('./a.js'),
  import('./b.js'),
  import('hyperscript'),
])
.then(result => {
  console.log({ result })
})