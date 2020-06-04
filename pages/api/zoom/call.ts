import axios, { Method } from 'axios'
import { NextApiRequest, NextApiResponse } from 'next'

export default async function zoomCallHandler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { token, endpoint, method } = req.query
  let response: any
  try {
    response = await axios.request({
      url: endpoint as string,
      method: (method || 'GET') as Method,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    console.log('response', method || 'GET', endpoint, response.data)
  } catch (error) {
    res.status(error.response.status || 500)
    res.json(error.response.data || { error: 'internal server error' })
    if (!error.response) {
      console.error(error)
    } else {
      console.error(method || 'GET', endpoint, error.response.data)
    }
    return
  }
  res.status(response.status)
  res.json(response.data)
}
