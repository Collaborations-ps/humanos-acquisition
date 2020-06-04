import { fetchZoomAPI } from '../../../services/zoom'

interface ChooseAnotherAccountParams {
  token: string
}

export default async function chooseAnotherAccount(
  params: ChooseAnotherAccountParams,
) {
  const { token } = params
  await fetchZoomAPI('https://api.zoom.us/v2/users/me/token', {
    method: 'DELETE',
    token,
  })
}
