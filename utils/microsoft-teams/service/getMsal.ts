import { UserAgentApplication, Logger } from 'msal'

import { publicRuntimeConfig } from '../../config'

let msal: UserAgentApplication

export default function getMsal() {
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
