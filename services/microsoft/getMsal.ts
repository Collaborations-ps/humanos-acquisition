import { UserAgentApplication, Logger } from 'msal'

import { publicRuntimeConfig } from '../../utils/config'

import Application from './Application'

type Instances = { [key in Application]: UserAgentApplication | null }

const instances: Partial<Instances> = {}

const instanceAuth = {
  teams: {
    clientId: publicRuntimeConfig.MICROSOFT_TEAMS_CLIENT_ID,
    authority: publicRuntimeConfig.MICROSOFT_TEAMS_AUTHORITY,
    redirectUri: publicRuntimeConfig.MICROSOFT_TEAMS_REDIRECT_URI,
    postLogoutRedirectUri: publicRuntimeConfig.MICROSOFT_TEAMS_REDIRECT_URI,
  },
  // TODO: Replace teams envs with outlook app envs
  outlook: {
    clientId: publicRuntimeConfig.MICROSOFT_TEAMS_CLIENT_ID,
    authority: publicRuntimeConfig.MICROSOFT_TEAMS_AUTHORITY,
    redirectUri: publicRuntimeConfig.MICROSOFT_TEAMS_REDIRECT_URI,
    postLogoutRedirectUri: publicRuntimeConfig.MICROSOFT_TEAMS_REDIRECT_URI,
  },
}

export default function getMsal(application: Application) {
  if (instances[application]) {
    return instances[application] as UserAgentApplication
  }

  const instance = new UserAgentApplication({
    auth: {
      validateAuthority: true,
      navigateToLoginRequestUrl: false,
      ...(instanceAuth[application] || {}),
    },
    cache: {
      // TODO: Is this the right place for cache for multiple instances
      cacheLocation: 'sessionStorage',
    },
    system: {
      navigateFrameWait: 500,
      logger: new Logger((logLevel, message) => {
        console.log(message) // eslint-disable-line no-console
      }),
      telemetry: {
        applicationName: 'humanos-acquisition',
        applicationVersion: '1.0.0',
        telemetryEmitter: events => {
          console.log('events', events) // eslint-disable-line no-console
        },
      },
    },
  })

  instances[application] = instance

  return instance
}
