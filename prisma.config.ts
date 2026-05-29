import { defineConfig, env } from 'prisma/config'
import * as dotenv from 'dotenv'
import * as path from 'node:path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

export default defineConfig({
  datasource: {
    url: env('DATABASE_URL'),
  },
})
