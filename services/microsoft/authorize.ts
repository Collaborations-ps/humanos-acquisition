import { InteractionRequiredAuthError } from 'msal'

import getMsal from './getMsal'

import Application from './Application'

interface AuthorizationParams {
  application: Application
  email: string
}

type Scopes = { [key in Application]: string[] }

const scopes: Scopes = {
  [Application.teams]: ['User.Read', 'Group.Read.All'],
  [Application.outlook]: ['User.Read', 'Mail.ReadBasic'],
}

export default async function authorize(params: AuthorizationParams) {
  const msal = getMsal(params.application)

  const request = {
    loginHint: params.email,
    scopes: scopes[params.application],
    prompt: 'consent',
  }

  let tokenResponse: any
  try {
    tokenResponse = await msal.acquireTokenSilent(request)
  } catch (error) {
    if (error instanceof InteractionRequiredAuthError) {
      tokenResponse = await msal.acquireTokenPopup(request)
    } else {
      throw error
    }
  }
  return tokenResponse
}
