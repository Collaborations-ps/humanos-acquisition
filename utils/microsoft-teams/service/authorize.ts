/* eslint-disable @typescript-eslint/camelcase */

import { UserAgentApplication, Logger } from 'msal'
import { publicRuntimeConfig } from '../../config'

let msal: UserAgentApplication
function getMsal() {
  if (!msal) {
    msal = new UserAgentApplication({
      auth: {
        clientId: publicRuntimeConfig.MICROSOFT_TEAMS_CLIENT_ID,
        authority: publicRuntimeConfig.MICROSOFT_TEAMS_AUTHORITY,
        redirectUri: publicRuntimeConfig.MICROSOFT_TEAMS_REDIRECT_URI,
        validateAuthority: true,
        postLogoutRedirectUri: publicRuntimeConfig.MICROSOFT_TEAMS_REDIRECT_URI,
        navigateToLoginRequestUrl: false,
      },
      cache: {
        cacheLocation: 'sessionStorage',
      },
      system: {
        navigateFrameWait: 500,
        logger: new Logger((logLevel, message) => {
          console.log(message)
        }),
        telemetry: {
          applicationName: 'humanos-acquisition',
          applicationVersion: '1.0.0',
          telemetryEmitter: events => {
            console.log('events', events)
          },
        },
      },
    })
  }
  return msal
}

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
