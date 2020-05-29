import getMsal from './getMsal'

import Application from './Application'

export default async function logout(application: Application) {
  // TODO: Microsoft doesn't support "silent logout
  // https://github.com/AzureAD/microsoft-authentication-library-for-js/issues/113
  // https://github.com/AzureAD/microsoft-authentication-library-for-js/issues/1386

  const msalApp = getMsal(application)
  // @ts-ignore
  msalApp.clearCache()
  // @ts-ignore
  msalApp.account = null
  // @ts-ignore
  msalApp.authorityInstance.resolveEndpointsAsync().then(authority => {
    const urlNavigate = authority.EndSessionEndpoint
      ? authority.EndSessionEndpoint
      : `${msalApp.authority}oauth2/v2.0/logout`
    ;(msalApp as any).openPopup(urlNavigate, 'msal', 400, 600)
  })
}
