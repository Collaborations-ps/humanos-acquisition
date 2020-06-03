/* eslint-disable @typescript-eslint/camelcase */

import qs from 'qs'
import axios from 'axios'
import { NextApiRequest, NextApiResponse } from 'next'

import { serverRuntimeConfig } from '../../../utils/config'

const AUTHORIZE_URL = 'https://zoom.us/oauth/authorize'
const TOKEN_URL = 'https://zoom.us/oauth/token'

export default async function zoomHandler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { code } = req.query

  if (code) {
    const token = Buffer.from(
      `${serverRuntimeConfig.ZOOM_CLIENT_ID}:${serverRuntimeConfig.ZOOM_CLIENT_SECRET}`,
    ).toString('base64')

    const tokenQuery = qs.stringify({
      grant_type: 'authorization_code',
      code,
      redirect_uri: 'http://localhost:3000/api/zoom',
    })

    try {
      const tokenResponse = await axios({
        url: `${TOKEN_URL}?${tokenQuery}`,
        method: 'POST',
        headers: {
          Authorization: `Basic ${token}`,
        },
      })
      res.status(302)
      res.setHeader(
        'Location',
        `http://localhost:3000/zoom?token=${tokenResponse.data.access_token}`,
      )
      res.end()
      return
    } catch (error) {
      console.error('ERROR', error.response.data)
    }
    res.json({ error: 'internal server error' })
    return
  }

  const authorizeQuery = qs.stringify({
    response_type: 'code',
    client_id: serverRuntimeConfig.ZOOM_CLIENT_ID,
    redirect_uri: 'http://localhost:3000/api/zoom',
  })
  res.status(302)
  res.setHeader('Location', `${AUTHORIZE_URL}?${authorizeQuery}`)
  res.end()
}
