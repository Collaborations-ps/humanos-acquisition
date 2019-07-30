import React, { PureComponent } from 'react'
import {
  GoogleLogin,
  GoogleLoginResponse,
  GoogleLoginResponseOffline,
} from 'react-google-login'
import axios from 'axios'

import get from 'lodash/get'
import sampleSize from 'lodash/sampleSize'

import Timer from './timer'

import { parseMessages } from '../utils'
import localApi, { Mailbox } from '../utils/localApi'
import api from '../utils/api'

interface Auth {
  accessToken: string
  email: string
  expiresAt: number
}

interface State {
  googleAuth?: Auth | null
  error: boolean
  mailbox: Mailbox | null
  loadingMessages: boolean
  messagesExample: any
  fileUploading: boolean
}

function parseLoginResponse(response: GoogleLoginResponse): Auth {
  const authResponse = response.getAuthResponse()
  return {
    accessToken: authResponse.access_token,
    email: response.getBasicProfile().getEmail(),
    expiresAt: authResponse.expires_at,
  }
}

class App extends PureComponent<{}, State> {
  public state = {
    googleAuth: null,
    error: false,
    mailbox: null,
    loadingMessages: false,
    messagesExample: [],
    fileUploading: false,
  }

  public messages = []

  public async componentDidMount() {
    if (sessionStorage) {
      const googleData = sessionStorage.getItem('google')

      if (googleData) {
        this.setState(
          {
            googleAuth: JSON.parse(googleData),
          },
          async () => {
            const mailbox = await localApi.getAllMailbox()
            this.setState({
              mailbox,
            })
          },
        )
      }
    }
  }

  private handleSuccessLogin = async (
    response: GoogleLoginResponse | GoogleLoginResponseOffline,
  ): Promise<void> => {
    const googleAuth = parseLoginResponse(response as GoogleLoginResponse)

    sessionStorage.setItem('google', JSON.stringify(googleAuth))

    this.setState(
      {
        googleAuth,
      },
      async () => {
        const mailbox = await localApi.getAllMailbox()
        this.setState({
          mailbox,
        })
      },
    )
  }

  private handleFailureLogin = (): void => {
    this.setState({ error: true })
  }

  private handleLogout = () => {
    sessionStorage.removeItem('google')
    this.setState({
      googleAuth: null,
      mailbox: null,
      loadingMessages: false,
      error: false,
      messagesExample: [],
    })
  }

  private handleFetchMessages = async () => {
    const { googleAuth, mailbox } = this.state

    if (typeof googleAuth === 'object') {
      this.setState({ loadingMessages: true })

      const messagesResponse = await axios.get('/messages', {
        params: {
          ...(googleAuth || {}),
          mailbox: get(mailbox, 'path'),
          limit: `1:${get(mailbox, 'count', '*')}`,
        },
      })

      this.messages = await parseMessages(messagesResponse.data)

      this.setState({
        loadingMessages: false,
        messagesExample: sampleSize(this.messages, 10),
      })
    }
  }

  private handleGenerateAndUploadFile = async () => {
    this.setState({ fileUploading: true })
    const blob = new Blob([JSON.stringify(this.messages)])

    const file = new File([blob], 'data.json', { type: 'application/json' })

    const s3Url = await api.signGMailData({
      name: file.name,
      contentType: 'application/json',
      size: file.size,
    })

    if (typeof s3Url === 'string') {
      await axios.put(s3Url, file, {
        headers: {
          'Content-Type': 'application/json',
        },
      })
    }

    this.setState({ fileUploading: false })
  }

  public render() {
    const {
      googleAuth,
      mailbox,
      error,
      loadingMessages,
      messagesExample,
      fileUploading,
    } = this.state

    return (
      <>
        {error && <div>Error occured</div>}
        {googleAuth ? (
          <>
            <div className="header">
              <div className="block messages">
                {mailbox ? (
                  <>
                    Mailbox: {get(mailbox, 'path')}
                    <br />
                    <small>Messages count: {get(mailbox, 'count')}</small>
                    <br />
                    <button type="button" onClick={this.handleFetchMessages}>
                      Fetch messages
                    </button>
                  </>
                ) : (
                  <div>Loading mailbox data...</div>
                )}
              </div>
              <div className="block user">
                {get(googleAuth, 'email')}
                <br />
                <small>
                  Session expires at:{' '}
                  <Timer
                    expiresAt={
                      (get(googleAuth, 'expiresAt') as unknown) as number
                    }
                    onTimedOut={this.handleLogout}
                  />
                </small>
                <br />
                <button type="button" onClick={this.handleLogout}>
                  Logout
                </button>{' '}
              </div>
            </div>
            <div className="content">
              {loadingMessages && (
                <div className="loading">
                  Fetching {get(mailbox, 'count')} messages...
                </div>
              )}
              {messagesExample.length > 0 && (
                <div className="acquired">
                  Example of data we acquired (example: {messagesExample.length}
                  , total loaded: {this.messages.length}):
                  <br />
                  <pre>
                    ...{'\n'}
                    {JSON.stringify(messagesExample, null, 2)}
                    {'\n'}...
                  </pre>
                  <div>
                    If all ok, you can{' '}
                    <button
                      type="button"
                      onClick={this.handleGenerateAndUploadFile}
                    >
                      Upload this file
                    </button>
                    {fileUploading && <div>Uploading file</div>}
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <GoogleLogin
            buttonText="Connect GMail"
            clientId="720894567388-a4n3ni07clit5drod5kue0q4qcn18kpv.apps.googleusercontent.com"
            cookiePolicy="single_host_origin"
            scope="https://mail.google.com/"
            onFailure={this.handleFailureLogin}
            onSuccess={this.handleSuccessLogin}
          />
        )}
      </>
    )
  }
}

export default App
