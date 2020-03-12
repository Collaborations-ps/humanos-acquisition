import React, { PureComponent } from 'react'
import {
  GoogleLoginResponse,
  GoogleLoginResponseOffline,
} from 'react-google-login'
import axios from 'axios'
import { Duration } from 'luxon'
import pluralize from 'pluralize'
import { Box, Flex, Image, Text } from 'rebass'

import get from 'lodash/get'

import { Header, Loading, Overlay, Progress } from '../utils/styles'

import api from '../utils/api'
import startFetchingMessages, { ACTIONS } from '../utils/gmail'

import Done from '../components/Done'
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

interface Auth {
  accessToken: string
  email: string
  expiresAt: number
}

interface State {
  googleAuth?: Auth | null
  error: boolean
  step: STEPS
  fetchedMessagesCount: number
  totalMessagesCount: number
  listCount: number
  done: boolean
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
    <Loading>
      <Image alt="loader" mb={4} src="/static/loader.svg" /> {children}
    </Loading>
  )
}

function isAuthExpired(authData: Auth) {
  return authData.expiresAt < +new Date()
}

function formatTimeLeft(messagesLeft: number) {
  const estimatedLeft = Duration.fromMillis((messagesLeft / 50) * 1250)

  const years = estimatedLeft.as('years')
  if (years > 1) {
    return pluralize('year', Math.round(years), true)
  }

  const months = estimatedLeft.as('months')
  if (months > 1) {
    return pluralize('month', Math.round(months), true)
  }

  const days = estimatedLeft.as('days')
  if (days > 1) {
    return pluralize('day', Math.round(days), true)
  }

  const hours = estimatedLeft.as('hours')
  if (hours > 1) {
    return pluralize('hour', Math.round(hours), true)
  }

  const minutes = estimatedLeft.as('minutes')
  if (minutes > 1) {
    return pluralize('minute', Math.round(minutes), true)
  }

  const seconds = estimatedLeft.as('seconds')
  return pluralize('second', Math.round(seconds), true)
}

class App extends PureComponent<{}, State> {
  public state = {
    googleAuth: null,
    error: false,
    step: STEPS.initial,
    fetchedMessagesCount: 0,
    totalMessagesCount: 0,
    listCount: 0,
    done: false,
  }

  public messages: any[] = []

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

    this.runWorkflow(googleAuth)
  }

  private handleFailureLogin = (error: any): void => {
    console.log('handleFailureLogin', error)
    this.setState({ error: true })
  }

  private handleLogout = (done = false) => () => {
    sessionStorage.removeItem('google')

    this.setState({
      googleAuth: null,
      error: false,
      step: STEPS.initial,
      fetchedMessagesCount: 0,
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

  private async runWorkflow(googleAuth: Auth) {
    const { step } = this.state

    if (step !== STEPS.initial) {
      return
    }

    this.setState({
      googleAuth,
      step: STEPS.connecting,
    })

    await startFetchingMessages(
      `Bearer ${googleAuth.accessToken}`,
      ({ action, value }) => {
        switch (action) {
          case ACTIONS.ERROR:
            this.setState({ error: true })
            break
          case ACTIONS.START:
            this.setState({ step: STEPS.fetchLists })
            break
          case ACTIONS.LIST_LOADED:
            this.setState({
              step: STEPS.fetchLists,
              listCount: value,
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

          default:
            break
        }
      },
    )
  }

  private renderStatus() {
    const {
      step,
      googleAuth,
      listCount,
      fetchedMessagesCount,
      totalMessagesCount,
    } = this.state

    const estimatedLeft = formatTimeLeft(
      totalMessagesCount - fetchedMessagesCount,
    )

    switch (step) {
      case STEPS.connecting:
        return renderLoading(`Connecting GMail API...`)
      case STEPS.fetchLists:
        return renderLoading(
          `Fetching lists of messages for "${get(
            googleAuth,
            'email',
          )}. Lists fetched: ${listCount}`,
        )
      case STEPS.fetchMessages:
        return renderLoading(
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
                  Cc Bcc Date
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
        return renderLoading(`Signing metadata file to upload...`)
      case STEPS.uploadingFile:
        return renderLoading(`Uploading metadata file...`)
      case STEPS.notifyApp:
        return renderLoading(`Notify application about upload...`)
      default:
        return null
    }
  }

  public render() {
    const { googleAuth, error, done } = this.state

    if (done) {
      return <Done error={error} />
    }

    return (
      <>
        {error && <Box>Error occured</Box>}
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
