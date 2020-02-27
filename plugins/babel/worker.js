import { parentPort } from 'worker_threads'

import babel from '@babel/core'

import dynamic from '@babel/plugin-syntax-dynamic-import'
import commonjs from '@babel/plugin-transform-modules-commonjs'
import imports from '@babel/helper-module-imports'

let options = {
  plugins: [],
  presets: [],
  replace: {
    global: 'globalThis',
  },
  helpers: {
    process: 'process',
    Buffer: {
      Buffer: 'buffer'
    }
  }
}

parentPort.on('message', async function onMessage({ url, source, options: configure }) {
  if(configure) {
    return options = { ...options, ...configure }
  }

  const { pathname: filename } = new URL(url)

  function replace(babel) {
    const { types: t } = babel

    return {
      visitor: {
        ReferencedIdentifier(path, state) {
          const { node, scope } = path
          if(scope.hasBinding(node.name)) return
          if(node.name === 'this') return

          const { name } = path.node

          const helper = options.helpers[name]
          const replace = options.replace[name]
          const basePath = state.file.path

          if(helper) {
            if(typeof helper === 'string') {              
              path.replaceWith(imports.addNamed(basePath, 'default', helper))
            } else {
              for(const [ name, source ] of Object.entries(helper)) {
                if(name === node.name) {
                  path.replaceWith(imports.addNamed(basePath, name, source))
                }
              }
            }
          } else if(replace) {
            path.replaceWith(t.identifier(replace))
          }
        },
      }
    }
  }

  function gatherDependencies({ types }) {    
    const { memberExpression, identifier, callExpression, numericLiteral } = types

    let index = 0

    let ids = {}


    return {
      visitor: {
        CallExpression(path) {
          const { type, name } = path.node.callee

          if(!/^Import|require$/.test(name || type)) return
          
          const [ { type: kind, value: dependency } ] = path.node.arguments

          if(kind !== "StringLiteral") return

          const lazy = type === 'Import'
          const local = ids[dependency] || (ids[dependency] = index++)

          const require = callExpression(identifier('require'), [ numericLiteral(local) ])

          if(lazy) {
            const resolve = memberExpression(identifier('Promise'), identifier('resolve'))

            path.replaceWith(callExpression(resolve, [ require ]))
          } else [
            path.replaceWith(require)
          ]

          parentPort.postMessage({ url, local, dependency, lazy })
        }
      }
    }
  }

  const plugins = [ ...options.plugins, replace, dynamic, commonjs, gatherDependencies ]
  const presets = [ ...options.presets ]

  try {
    const { code } = await babel.transform(source, { filename, plugins, presets })

    parentPort.postMessage({ url, source: code })
  } catch(error) {
    parentPort.postMessage({ url, error })
  }
})