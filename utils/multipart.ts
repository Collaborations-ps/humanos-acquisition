export function parseHeader(header: string) {
  const headerFields: any = {}
  const matchResult = header.match(/^.*<response-item:([a-fA0-9]+)>$/)

  if (matchResult) {
    // eslint-disable-next-line
    headerFields.name = matchResult[1]
  }

  return headerFields
}

export function parseMultipart(body: string, contentType: string) {
  const m = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/i)

  if (!m) {
    throw new Error('Bad content-type header, no multipart boundary')
  }

  const s = `\r\n${body}`
  let boundary = m[1] || m[2]

  boundary = `\r\n--${boundary}`

  const parts = s.split(new RegExp(boundary))
  const partsByName: any = {}

  for (let i = 1; i < parts.length - 1; i += 1) {
    const subparts = parts[i].split('\r\n\r\n')

    const headers = subparts[0].split('\r\n')

    for (let j = 1; j < headers.length; j += 1) {
      const headerFields = parseHeader(headers[j])

      if (headerFields.name && !partsByName[headerFields.name]) {
        // eslint-disable-next-line
        partsByName[headerFields.name] = JSON.parse(subparts[2])
      }
    }
  }

  return partsByName
}
