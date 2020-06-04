export default function objToFile(obj: object, possiblyFilename?: string) {
  const filename = possiblyFilename || 'data.json'

  const blob = new Blob([JSON.stringify(obj)])

  const file = new File([blob], filename, { type: 'application/json' })

  return file
}
