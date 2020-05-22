import getMsal from './getMsal'

function doesRequireInteraction(error: any) {
  if (!error.errorCode || !error.errorCode.length) {
    return false
  }

  return (
    error.errorCode.indexOf('consent_required') > -1 ||
    error.errorCode.indexOf('interaction_required') > -1 ||
    error.errorCode.indexOf('login_required') > -1
  )
}

export default async function authorize() {
  const request = {
    loginHint: 'email',
    scopes: ['User.Read', 'Group.Read.All'],
    prompt: 'select_account',
  }
  let tokenResponse: any
  try {
    tokenResponse = await getMsal().acquireTokenSilent(request)
  } catch (error) {
    if (doesRequireInteraction(error)) {
      tokenResponse = await getMsal().acquireTokenPopup(request)
    } else {
      throw error
    }
  }
  return tokenResponse
}
