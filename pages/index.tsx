import React, { PureComponent } from 'react'
import {
  GoogleLoginResponse,
  GoogleLoginResponseOffline,
} from 'react-google-login'
import axios from 'axios'
import { Box, Button, Flex, Image, Text } from 'rebass'

import get from 'lodash/get'
import noop from 'lodash/noop'

import { Header, Loading, Overlay, Progress } from '../utils/styles'
import { formatTimeLeft } from '../utils/time'
import api from '../utils/api'
import startFetchingMessages, { ACTIONS } from '../utils/gmail'

import Done from '../components/Done'
import Error from '../components/Error'
import WrongEmail from '../components/WrongEmail'
import Information from '../components/Information'

enum STEPS {
  initial,
  connecting,
  fetchLists,
  fetchMessages,
  messagesFetched,
  signingFile,
  uploadingFile,
  notifyApp,
}

const LOCKED_STEPS = [
  STEPS.connecting,
  STEPS.fetchLists,
  STEPS.fetchMessages,
  STEPS.messagesFetched,
  STEPS.signingFile,
  STEPS.uploadingFile,
  STEPS.notifyApp,
]

const CANCELABLE_STEPS = [STEPS.fetchLists, STEPS.fetchMessages]

function parseLoginResponse(response: GoogleLoginResponse): Auth {
  const authResponse = response.getAuthResponse()
  return {
    accessToken: authResponse.access_token,
    email: response.getBasicProfile().getEmail(),
    expiresAt: authResponse.expires_at,
  }
}

interface Auth {
  accessToken: string
  email: string
  expiresAt: number
}
function isAuthExpired(authData: Auth) {
  return authData.expiresAt < +new Date()
}

interface Props {
  emails: string[]
}
interface State {
  googleAuth?: Auth | null
  error: boolean | string
  wrongEmail: boolean
  step: STEPS
  fetchedMessagesCount: number
  totalMessagesCount: number
  messagesCount: number
  done: boolean
}
class App extends PureComponent<Props, State> {
  public state = {
    googleAuth: null,
    error: false,
    wrongEmail: false,
    step: STEPS.initial,
    fetchedMessagesCount: 0,
    totalMessagesCount: 0,
    messagesCount: 0,
    done: false,
  }

  public messages: any[] = []

  private callback = {
    cancel: noop,
    onAction: ({ action, value }: { action: ACTIONS; value?: any }) => {
      switch (action) {
        case ACTIONS.ERROR:
          if (this.callback.cancel) {
            this.callback.cancel(ACTIONS.CANCELED_ON_ERROR)
          }
          this.setState({ error: value, step: STEPS.initial })
          break
        case ACTIONS.START:
          this.setState({ step: STEPS.fetchLists })
          break
        case ACTIONS.LIST_LOADED:
          this.setState({
            step: STEPS.fetchLists,
            messagesCount: value.messagesCount,
          })
          break
        case ACTIONS.TOTAL_MESSAGES:
          this.setState({
            step: STEPS.fetchMessages,
            totalMessagesCount: value,
            fetchedMessagesCount: 0,
          })
          break
        case ACTIONS.MESSAGES_LOADED:
          this.setState({
            step: STEPS.fetchMessages,
            fetchedMessagesCount: value,
          })
          break
        case ACTIONS.DONE:
          this.messages = value
          this.generateAndUploadFile()
          break

        case ACTIONS.CANCELED:
          this.handleChooseAnother()
          break

        default:
          break
      }
    },
  }

  public async componentDidMount() {
    if (sessionStorage) {
      const googleData = sessionStorage.getItem('google')

      if (googleData) {
        const googleAuth = JSON.parse(googleData)

        if (googleAuth) {
          if (isAuthExpired(googleAuth)) {
            sessionStorage.removeItem('google')

            this.setState({
              googleAuth: null,
            })
          } else {
            this.setState({ googleAuth })
          }
        }

        this.runWorkflow(googleAuth)
      }
    }

    window.addEventListener('beforeunload', this.handleUnload)
  }

  public componentWillUnmount() {
    window.removeEventListener('beforeunload', this.handleUnload)
  }

  private handleUnload = (e: any) => {
    const { step } = this.state

    if (LOCKED_STEPS.includes(step)) {
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

    this.setState({ googleAuth })

    this.runWorkflow(googleAuth)
  }

  private handleFailureLogin = () => {
    this.setState({ error: true })
  }

  private handleChooseAnother = () => {
    this.handleLogout(false)()
  }

  private handleLogout = (done = false) => () => {
    sessionStorage.removeItem('google')

    this.setState({
      googleAuth: null,
      error: false,
      step: STEPS.initial,
      fetchedMessagesCount: 0,
      wrongEmail: false,
      done,
    })
  }

  private generateAndUploadFile = async () => {
    const { googleAuth } = this.state

    this.setState({ step: STEPS.signingFile })
    const blob = new Blob([JSON.stringify(this.messages)])

    const file = new File([blob], 'data.json', { type: 'application/json' })

    const s3Data = await api.signGmailPackage({
      name: file.name,
      contentType: 'application/json',
      size: file.size,
      email: get(googleAuth, 'email') || '',
    })

    const s3Url = get(s3Data, 's3Url')
    const s3Id = get(s3Data, 'id')

    if (typeof s3Url === 'string') {
      this.setState({ step: STEPS.uploadingFile })
      await axios.put(s3Url, file, {
        headers: {
          'Content-Type': 'application/json',
        },
      })

      this.setState({ step: STEPS.notifyApp })
      await api.sendNotification(s3Id, get(googleAuth, 'email') || '')
    }

    this.handleLogout(true)()
  }

  handleCancel = () => {
    if (this.callback.cancel) {
      this.callback.cancel(ACTIONS.CANCELED)
    }
  }

  private async runWorkflow(googleAuth: Auth) {
    const { emails } = this.props

    if (!emails.includes(googleAuth.email)) {
      this.setState({ wrongEmail: true })
      return
    }

    const { step } = this.state

    if (step !== STEPS.initial) {
      return
    }

    this.setState({
      googleAuth,
      step: STEPS.connecting,
    })

    await startFetchingMessages({
      token: `Bearer ${googleAuth.accessToken}`,
      callback: this.callback,
    })
  }

  private renderLoading = (children: any) => {
    const { step } = this.state

    return (
      <Loading>
        <Image alt="loader" mb={4} src="/static/loader.svg" /> {children}
        {CANCELABLE_STEPS.includes(step) && (
          <Button
            bg="white"
            color="#364152"
            fontSize={12}
            mt={3}
            type="button"
            onClick={this.handleCancel}
          >
            Cancel
          </Button>
        )}
      </Loading>
    )
  }

  private renderStatus() {
    const {
      step,
      messagesCount,
      fetchedMessagesCount,
      totalMessagesCount,
    } = this.state

    const estimatedLeft = formatTimeLeft(
      totalMessagesCount - fetchedMessagesCount,
    )

    switch (step) {
      case STEPS.connecting:
        return this.renderLoading(`Connecting GMail API...`)
      case STEPS.fetchLists:
        return this.renderLoading(
          <>
            We are counting the total number of messages: {messagesCount}.<br />
            This will enable us to complete the analysis of To/From your Inbox.
          </>,
        )
      case STEPS.fetchMessages:
        return this.renderLoading(
          <Box
            color="#ffffff"
            fontSize="16px"
            sx={{ lineHeight: 1.8, fontWeight: 500 }}
          >
            {`We found ${totalMessagesCount} emails.`.toUpperCase()} <br />
            We are collecting the following fields ONLY: <br />
            <Flex
              bg="#fafbfd"
              flexDirection="column"
              my={3}
              px={3}
              py={2}
              sx={{
                borderRadius: '8px',
                border: '1px solid #e3e3e6',
              }}
            >
              <Flex justifyContent="space-between" mb={1}>
                <Text color="#364152" fontSize={['10px', '12px']}>
                  To
                </Text>
                <Text color="#364152" fontSize={['10px', '12px']}>
                  Cc
                </Text>
              </Flex>
              <Box bg="#e3e3e6" height="1px" width="100%" />
              <Flex justifyContent="space-between" mb={1}>
                <Text color="#364152" fontSize={['10px', '12px']} mt={1}>
                  From
                </Text>
                <Text color="#364152" fontSize={['10px', '12px']} mt={1}>
                  Date
                </Text>
              </Flex>
            </Flex>
            You can review Google’s & Collaboration.Ai’s Privacy policies at any
            time.
            <br />
            <br />
            Please do not leave this page while we are processing your To/From
            data.
            <Box mt={3} width={1}>
              <Progress
                value={Math.round(
                  (fetchedMessagesCount / totalMessagesCount) * 100,
                )}
              />
              <Text fontSize={['12px', '14px']} mt={2} textAlign="center">
                Estimated time left: ~{estimatedLeft}
              </Text>
            </Box>
          </Box>,
        )
      case STEPS.signingFile:
        return this.renderLoading(`Signing metadata file to upload...`)
      case STEPS.uploadingFile:
        return this.renderLoading(`Uploading metadata file...`)
      case STEPS.notifyApp:
        return this.renderLoading(`Notify application about upload...`)
      default:
        return null
    }
  }

  public render() {
    const { emails } = this.props
    const { googleAuth, wrongEmail, error, done } = this.state

    if (error) {
      return <Error error={error} />
    }
    if (wrongEmail) {
      return (
        <WrongEmail
          email={get(googleAuth, 'email') || ''}
          emails={emails}
          onChooseAnother={this.handleChooseAnother}
        />
      )
    }
    if (done) {
      return <Done error={error} />
    }

    return (
      <>
        {error && <Box>Error occurred</Box>}
        {googleAuth ? (
          <>
            <Overlay>{this.renderStatus()}</Overlay>
            <Header>
              <button
                className="small"
                type="button"
                onClick={this.handleLogout(false)}
              >
                Logout
              </button>
            </Header>
          </>
        ) : (
          <Information
            onLoginFailure={this.handleFailureLogin}
            onLoginSuccess={this.handleSuccessLogin}
          />
        )}
      </>
    )
  }
}

export default App
