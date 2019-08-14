import React, { PureComponent } from 'react'
import {
  GoogleLogin,
  GoogleLoginResponse,
  GoogleLoginResponseOffline,
} from 'react-google-login'
import axios from 'axios'

import get from 'lodash/get'
import sampleSize from 'lodash/sampleSize'

import { parseMessages } from '../utils'
import localApi, { Mailbox } from '../utils/localApi'
import api from '../utils/api'

enum STEPS {
  initial,
  findingMailbox,
  fetchMessages,
  messagesFetched,
  signingFile,
  uploadingFile,
  notifyApp,
  done,
}

const BLOCKED_STEPS = [
  STEPS.findingMailbox,
  STEPS.fetchMessages,
  STEPS.messagesFetched,
  STEPS.signingFile,
  STEPS.uploadingFile,
  STEPS.notifyApp,
]

interface Auth {
  accessToken: string
  email: string
  expiresAt: number
}

interface State {
  googleAuth?: Auth | null
  error: boolean
  mailbox: Mailbox | null
  messagesExample: any
  exampleShown: boolean
  step: STEPS
}

function parseLoginResponse(response: GoogleLoginResponse): Auth {
  const authResponse = response.getAuthResponse()
  return {
    accessToken: authResponse.access_token,
    email: response.getBasicProfile().getEmail(),
    expiresAt: authResponse.expires_at,
  }
}

function renderLoading(children: any) {
  return (
    <div className="loading">
      <img alt="loader" src="/static/loader.svg" /> {children}
    </div>
  )
}

class App extends PureComponent<{}, State> {
  public state = {
    googleAuth: null,
    error: false,
    mailbox: null,
    messagesExample: [],
    exampleShown: false,
    step: STEPS.initial,
  }

  public messages = []

  public async componentDidMount() {
    if (sessionStorage) {
      const googleData = sessionStorage.getItem('google')

      if (googleData) {
        this.setState(
          {
            googleAuth: JSON.parse(googleData),
            step: STEPS.findingMailbox,
          },
          async () => {
            const mailbox = await localApi.getAllMailbox()

            this.setState(
              {
                mailbox,
                step: STEPS.fetchMessages,
              },
              this.handleFetchMessages,
            )
          },
        )
      }
    }

    window.addEventListener('beforeunload', this.handleUnload)
  }

  public componentWillUnmount() {
    window.removeEventListener('beforeunload', this.handleUnload)
  }

  private handleUnload = (e: any) => {
    const { step } = this.state

    if (BLOCKED_STEPS.includes(step)) {
      e.preventDefault()

      e.returnValue = 'We processing GMail, please wait until it will be done'

      return e.returnValue
    }

    return true
  }

  private handleSuccessLogin = async (
    response: GoogleLoginResponse | GoogleLoginResponseOffline,
  ): Promise<void> => {
    const googleAuth = parseLoginResponse(response as GoogleLoginResponse)

    sessionStorage.setItem('google', JSON.stringify(googleAuth))

    this.setState(
      {
        googleAuth,
        step: STEPS.findingMailbox,
      },
      async () => {
        const mailbox = await localApi.getAllMailbox()

        this.setState(
          {
            mailbox,
            step: STEPS.fetchMessages,
          },
          this.handleFetchMessages,
        )
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
      exampleShown: false,
      error: false,
      messagesExample: [],
    })
  }

  private handleFetchMessages = async () => {
    const { googleAuth, mailbox } = this.state

    if (typeof googleAuth === 'object') {
      const messagesResponse = await axios.get('/messages', {
        params: {
          ...(googleAuth || {}),
          mailbox: get(mailbox, 'path'),
          limit: `1:${get(mailbox, 'count', '*')}`,
        },
      })

      this.messages = await parseMessages(messagesResponse.data)

      this.setState({
        step: STEPS.messagesFetched,
        messagesExample: sampleSize(this.messages, 10),
      })
    }
  }

  private handleToggleExample = () => {
    this.setState(state => ({ exampleShown: !state.exampleShown }))
  }

  private handleGenerateAndUploadFile = async () => {
    const { googleAuth } = this.state

    this.setState({ step: STEPS.signingFile })
    const blob = new Blob([JSON.stringify(this.messages)])

    const file = new File([blob], 'data.json', { type: 'application/json' })

    const s3Url = await api.signGmailPackage({
      name: file.name,
      contentType: 'application/json',
      size: file.size,
    })

    if (typeof s3Url === 'string') {
      this.setState({ step: STEPS.uploadingFile })
      await axios.put(s3Url, file, {
        headers: {
          'Content-Type': 'application/json',
        },
      })

      this.setState({ step: STEPS.notifyApp })
      await api.sendNotification(get(googleAuth, 'email') || '')
    }

    this.setState({ step: STEPS.done })
  }

  private renderStatus() {
    const { step, googleAuth, mailbox } = this.state

    switch (step) {
      case STEPS.findingMailbox:
        return renderLoading(
          `Search for main mailbox in "${get(googleAuth, 'email')}"`,
        )
      case STEPS.fetchMessages:
        return renderLoading(
          `Fetching ${get(mailbox, 'count')} messages from "${get(
            mailbox,
            'path',
          )}"`,
        )
      case STEPS.messagesFetched:
        return (
          <div className="upload">
            <div className="text">
              We have fetched from/to information for all messages in your inbox (see data sample <a href="#" >here</a>)
              <br />
              <br />
              Do you want to  Continue and upload them to HumanOS?
            </div>
            <button type="button" >
              Upload
            </button>
          </div>
        )
      case STEPS.signingFile:
        return renderLoading(`Signing metadata file to upload...`)
      case STEPS.uploadingFile:
        return renderLoading(`Uploading metadata file...`)
      case STEPS.notifyApp:
        return renderLoading(`Notify application about upload...`)
      case STEPS.done:
        return (
          <div className="upload">
            All done! <br />
            We notify you when data will be processed. <br />
            Now you can close this window.
          </div>
        )
      default:
        return null
    }
  }

  public render() {
    const { googleAuth, error, exampleShown, messagesExample } = this.state

    return (
      <>
        {error && <div>Error occured</div>}
        {googleAuth ? (
          <>
            {exampleShown && (
              <div className="example">
                <button type="button" onClick={this.handleToggleExample}>
                  close
                </button>
                <pre>
                  ...{'\n'}
                  {JSON.stringify(messagesExample, null, 2)}
                  {'\n'}...
                </pre>
              </div>
            )}
            <div className="overlay">{this.renderStatus()}</div>
            <div className="header">
              <button
                className="small"
                type="button"
                onClick={this.handleLogout}
              >
                Logout
              </button>
            </div>
          </>
        ) : (
          <GoogleLogin
            buttonText="Connect GMail"
            clientId="219313047580-d21scatk83efg15guk8qke0job6agvcb.apps.googleusercontent.com"
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
