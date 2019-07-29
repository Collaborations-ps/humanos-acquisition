import React, { PureComponent } from 'react'
import {
  GoogleLogin,
  GoogleLoginResponse,
  GoogleLoginResponseOffline,
} from 'react-google-login'
import axios from 'axios'

import get from 'lodash/get'
import find from 'lodash/find'
import sampleSize from 'lodash/sampleSize'

import Timer from './timer'

import { parseMessages } from '../utils'

import './index.css'

interface Auth {
  accessToken: string
  email: string
  expiresAt: number
}

interface Mailbox {
  count: number
}

interface State {
  auth?: Auth | null
  error: boolean
  mailbox: Mailbox | null
  loadingMessages: boolean
  messagesExample: any
  mailboxPath: string | undefined
}

function parseLoginResponse(response: GoogleLoginResponse): Auth {
  const authResponse = response.getAuthResponse()
  return {
    accessToken: authResponse.access_token,
    email: response.getBasicProfile().getEmail(),
    expiresAt: authResponse.expires_at,
  }
}

function parseMailboxData(mailboxData: any) {
  return {
    count: get(mailboxData, 'exists') as number,
  }
}

class App extends PureComponent<{}, State> {
  public state = {
    auth: null,
    error: false,
    mailbox: null,
    loadingMessages: false,
    messagesExample: [],
    mailboxPath: undefined,
  }

  public messages = []

  public componentDidMount() {
    if (sessionStorage) {
      const googleData = sessionStorage.getItem('google')

      if (googleData) {
        this.setState(
          {
            auth: JSON.parse(googleData),
          },
          async () => {
            this.getAllMailbox()
          },
        )
      }
    }
  }

  private async getMailboxes() {
    const { auth } = this.state

    if (auth !== null) {
      return axios.get('/mailboxes', {
        params: auth,
      })
    }
    return null
  }

  private async getAllMailbox() {
    const mailboxes = await this.getMailboxes()

    if (mailboxes) {
      const gmail = find(
        get(mailboxes, 'data.children', []),
        mailbox => mailbox.name === '[Gmail]',
      )

      const allMailbox = find(
        get(gmail, 'children', []),
        mailbox => mailbox.specialUse === '\\All',
      )

      if (allMailbox) {
        this.setState(
          {
            mailboxPath: allMailbox.path,
          },
          () => {
            this.getMailbox(allMailbox.path)
          },
        )
      }
    }
  }

  private async getMailbox(mailbox: string) {
    const { auth } = this.state

    if (auth !== null) {
      const mailboxResponse = await axios.get('/mailbox', {
        params: { ...(auth || {}), mailbox },
      })

      if (mailboxResponse.data) {
        this.setState({
          mailbox: parseMailboxData(mailboxResponse.data),
        })
      }
    }
  }

  private handleSuccessLogin = (
    response: GoogleLoginResponse | GoogleLoginResponseOffline,
  ): void => {
    const auth = parseLoginResponse(response as GoogleLoginResponse)

    sessionStorage.setItem('google', JSON.stringify(auth))

    this.setState({
      auth,
    })

    this.getAllMailbox()
  }

  private handleFailureLogin = (): void => {
    this.setState({ error: true })
  }

  private handleLogout = () => {
    sessionStorage.removeItem('google')
    this.setState({
      auth: null,
      mailbox: null,
      loadingMessages: false,
      error: false,
      messagesExample: [],
    })
  }

  private handleFetchMessages = async () => {
    const { auth, mailboxPath } = this.state

    if (typeof auth === 'object') {
      this.setState({ loadingMessages: true })

      const messagesResponse = await axios.get('/messages', {
        params: { ...(auth || {}), mailbox: mailboxPath, limit: '1:*' },
      })

      this.messages = await parseMessages(messagesResponse.data)

      this.setState({
        loadingMessages: false,
        messagesExample: sampleSize(this.messages, 10),
      })
    }
  }

  public render() {
    const {
      auth,
      mailbox,
      error,
      loadingMessages,
      messagesExample,
    } = this.state

    return (
      <>
        {error && <div>Error occured</div>}
        {auth ? (
          <>
            <div className="header">
              <div className="messages">
                {mailbox && (
                  <>
                    Messages count: {get(mailbox, 'count')}
                    <br />
                    <br />
                    <button type="button" onClick={this.handleFetchMessages}>
                      Fetch messages
                    </button>
                  </>
                )}
              </div>
              <div className="user">
                {get(auth, 'email')}
                <br />
                <small>
                  Session expires at:{' '}
                  <Timer
                    expiresAt={(get(auth, 'expiresAt') as unknown) as number}
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
                <div className="loading">loading messages...</div>
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
                </div>
              )}
            </div>
          </>
        ) : (
          <GoogleLogin
            buttonText="Login"
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
