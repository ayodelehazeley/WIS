const fs = require('fs')
const path = require('path')

const destination = path.resolve(__dirname, 'app/routes')
const root = path.resolve(__dirname, 'app/packages')
const routes = []
const paths = []
const queue = [root]
const stubs = {}

// Create routes directory
if (!fs.existsSync(destination)) {
  const destination = path.resolve(__dirname, 'app/routes')
  fs.mkdirSync(destination);
  console.log('Directory created:', destination);
} else {
  console.log('Directory already exists:', destination);
}


function getManifest(dir) {
  const manifest = path.resolve(dir, 'manifest.json')
  if (!fs.existsSync(manifest)) throw new Error(`No manifest found in ${dir}`)

  const contents = fs.readFileSync(manifest, 'utf8')
  return JSON.parse(contents)
}

function getStub(dir) {
  if (stubs[dir]) return stubs[dir]

  const json = getManifest(dir)

  let stub = json.dynamic ? `$${json.name}` : json.name
  if (!json.nest.path) {
    stub = `_${stub}`
  }

  stubs[dir] = stub
  return stubs[dir]
}

while (queue.length) {
  const dir = queue.shift()

  if (typeof dir === 'undefined') continue

  const files = fs.readdirSync(dir)
  files.forEach(file => {
    const abs = path.resolve(dir, file)
    const stat = fs.statSync(abs)

    if (stat.isDirectory() && !file.startsWith('_')) {
      paths.push(abs)
      queue.push(abs)
    }
  })
}

paths.sort()

paths.forEach(dir => {
  const manifest = getManifest(dir)
  let parent = path.dirname(dir)
  let parentStub = parent !== root ? getStub(parent) : undefined
  let stub = getStub(dir)

  if (parent !== root) {
    if (!manifest.nest.layout) {
      // parentStub = parentStub.startsWith('_')
      //   ? parentStub.split('_')[1]
      //   : parentStub
      parentStub = `${parentStub}_`
    }

    stub = [parentStub, stub].join('.')
  }

  stubs[dir] = stub
  const base = dir.slice(root.length - 8)
  let convertedBase = base

  // Check if the platform is Windows
  if (process.platform === 'win32') {
    // Replace "\" separator in base dir with /

    convertedBase = base.replace(/\\/g, '/')
  }

  // Layouts should always be available
  const layout = path.resolve(dir, '_layout.tsx')
  if (!fs.existsSync(layout)) {
    throw new Error(`No layout found in ${dir}`)
  }

  let route = path.resolve(destination, `${stub}.tsx`)
  routes.push(route)
  fs.writeFileSync(
    route,
    `export * from '~/${convertedBase}/_layout'\n
     export { default } from '~/${convertedBase}/_layout'\n
    `,
  )

  // console.log(`Writing pages for ${dir}`)
  // Write Pages
  const pages = path.resolve(dir, '_pages')
  fs.readdirSync(pages).forEach(file => {
    if (file === 'index.tsx') {
      route = path.resolve(destination, `${stub}._index.tsx`)
    } else {
      route = path.resolve(destination, `${stub}.${file}`)
    }

    routes.push(route)
    fs.writeFileSync(
      route,
      `export * from '~/${convertedBase}/_pages/${file.slice(
        0,
        file.length - 4,
      )}'\n
       export { default } from '~/${convertedBase}/_pages/${file.slice(
        0,
        file.length - 4,
      )}'\n
      `,
    )
  })
})


// Remove gitkeep file if present
fs.readdirSync(destination).forEach(file => {
  const abs = path.resolve(destination, file)
  if (routes.indexOf(abs) === -1) {
    if (file.endsWith('gitkeep')) fs.unlinkSync(abs)
  }
})
