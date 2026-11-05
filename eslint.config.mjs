import next from 'eslint-config-next/core-web-vitals'
import ts from 'eslint-config-next/typescript'

const config = [
  { ignores: ['src/app/(payload)/**', 'src/payload-types.ts', 'src/diagrams/data.ts', '.next/**'] },
  ...next,
  ...ts,
]

export default config