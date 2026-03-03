import { copyFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
const __dirname = dirname(fileURLToPath(import.meta.url))
copyFileSync(join(__dirname, '../dist/index.html'), join(__dirname, '../dist/404.html'))
console.log('Copied index.html to 404.html')
