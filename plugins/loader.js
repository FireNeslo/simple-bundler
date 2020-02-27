import { fileURLToPath } from 'url'
import { promises as fs } from 'fs'
import fetch from 'isomorphic-fetch'

async function http(url, asset) {
  if(!url.protocol.includes(['https:', 'http:'])) return asset

  const { href } = url

  const response = await fetch(href)

  if(!response.ok) throw response

  const [ type ] = response.headers.get('Content-Type').split(';')

  asset.url = response.url
  asset.type = type
  asset.source = await response.text()

  return asset
}

async function file(path, asset) {
  asset.source = await fs.readFile(path, 'utf8')

  return asset
}

function load(asset) {
  const url = new URL(asset.url)

  if(url.protocol === 'file:') {
    return file(fileURLToPath(url), asset)
  }

  return http(url, asset)
}

export default function createLoader() {
  return async function *loader(input) {
    for await(const asset of input) {
      if(asset.source) {
        yield asset
      } else {
        yield load(asset)
      }
    }
  }
}