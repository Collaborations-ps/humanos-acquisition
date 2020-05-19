/* eslint-disable @typescript-eslint/camelcase */

import { UserAgentApplication, Logger } from 'msal'

// TODO: Move these values to config
const CLIENT_ID = 'a534fba4-fa50-48fc-91f9-104352b86625'
const AUTHORITY = 'https://login.microsoftonline.com/common'
const REDIRECT_URI = 'http://localhost:3000/microsoft-teams'
const scopes = ['User.Read', 'Group.Read.All']

let msal: UserAgentApplication
function getMsal() {
  if (!msal) {
    msal = new UserAgentApplication({
      auth: {
        clientId: CLIENT_ID,
        authority: AUTHORITY,
        redirectUri: REDIRECT_URI,
        validateAuthority: true,
        postLogoutRedirectUri: 'http://localhost:3000/microsoft-teams',
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
    scopes,
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
