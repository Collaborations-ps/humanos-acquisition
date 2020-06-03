import axios from 'axios'
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
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
  } catch (error) {
    res.status(error.response.status || 500)
    res.json(error.response.data || { error: 'internal server error' })
    if (!error.response) {
      console.error(error)
    }
    return
  }
  res.status(response.status)
  res.json(response.data)
}
