import React, { PureComponent } from 'react'
import {
  GoogleLoginResponse,
  GoogleLoginResponseOffline,
} from 'react-google-login'
import axios from 'axios'
import openSocket from 'socket.io-client'
import qs from 'qs'

import get from 'lodash/get'

import { Box, Image, Flex, Card, Text, Link, Button } from 'rebass'

import {
  GoogleLogin,
  Upload,
  Loading,
  Header,
  Overlay,
  DescriptionText,
  Accent,
  Bolder,
  Bold,
  Progress,
} from '../utils/styles'

import { getAllMailboxPath, parseMailboxData, parseMessages } from '../utils'
import { publicRuntimeConfig } from '../utils/config'
import api from '../utils/api'

enum STEPS {
  initial,
  connectingImap,
  getMailboxes,
  findingAllMailbox,
  fetchMessages,
  messagesFetched,
  signingFile,
  uploadingFile,
  notifyApp,
}

const LOCKED_STEPS = [
  STEPS.connectingImap,
  STEPS.getMailboxes,
  STEPS.findingAllMailbox,
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

const LIMIT = 500

class App extends PureComponent<{}, State> {
  public state = {
    googleAuth: null,
    error: false,
    step: STEPS.initial,
    fetchedMessagesCount: 0,
    done: false,
  }

  public messages: any[] = []

  public socket: any = null

  private totalMessages = 0

  private currentCursor = 1

  private mailboxPath: string | null = null

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

        this.socketRunWorkflow(googleAuth)
      }
    }

    window.addEventListener('beforeunload', this.handleUnload)
  }

  public componentWillUnmount() {
    this.socket.disconnect()
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

    this.socketRunWorkflow(googleAuth)
  }

  private handleFailureLogin = (): void => {
    this.setState({ error: true })
  }

  private handleLogout = (done = false) => () => {
    sessionStorage.removeItem('google')
    this.socket.disconnect()
    this.setState({
      googleAuth: null,
      error: false,
      step: STEPS.initial,
      fetchedMessagesCount: 0,
      done,
    })
  }

  private handleGoToApp = () => {
    window.open(`${publicRuntimeConfig.WEB_URL}/app/individual`, '_self')
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

  private socketRunWorkflow(googleAuth: Auth) {
    const { step } = this.state

    if (step !== STEPS.initial) {
      return
    }

    this.setState({
      googleAuth,
      step: STEPS.connectingImap,
    })

    this.socket = openSocket('/', { query: qs.stringify(googleAuth) })

    this.socket.on('connect', () => {
      this.socket.on('imapConnected', ({ success }: any) => {
        if (success) {
          this.socketGetMailboxes()
        }
      })
    })
  }

  private socketGetMailboxes() {
    this.setState({ step: STEPS.getMailboxes })
    this.socket.emit('getMailboxes', (mailboxes: any) => {
      const mailboxPath = getAllMailboxPath(mailboxes)

      this.socketGetAllMailbox(mailboxPath)
    })
  }

  private socketGetAllMailbox(mailboxPath: string) {
    this.setState({ step: STEPS.findingAllMailbox })
    this.socket.emit('getMailbox', mailboxPath, (mailboxInfo: any) => {
      const mailboxData = parseMailboxData(mailboxPath, mailboxInfo)

      this.totalMessages = mailboxData.count
      this.mailboxPath = mailboxData.path

      this.socketRunMessagesFetch()
    })
  }

  private socketRunMessagesFetch() {
    const { step } = this.state

    const start = this.currentCursor
    const end = Math.min(this.currentCursor + LIMIT - 1, this.totalMessages)

    if (step !== STEPS.fetchMessages) {
      this.setState({ step: STEPS.fetchMessages })
    }

    this.socket.emit(
      'getMessages',
      this.mailboxPath,
      start,
      end,
      (messages: any) => {
        this.currentCursor = end + 1
        this.messages = [...this.messages, ...parseMessages(messages)]

        this.setState({ fetchedMessagesCount: end })

        if (this.currentCursor >= this.totalMessages) {
          this.generateAndUploadFile()
        } else {
          this.socketRunMessagesFetch()
        }
      },
    )
  }

  private renderStatus() {
    const { step, googleAuth, fetchedMessagesCount } = this.state

    switch (step) {
      case STEPS.connectingImap:
        return renderLoading(`Connecting IMAP...`)
      case STEPS.getMailboxes:
        return renderLoading(
          `Get list of mailboxes for "${get(googleAuth, 'email')}"`,
        )
      case STEPS.findingAllMailbox:
        return renderLoading(
          `Search for main mailbox in "${get(googleAuth, 'email')}"`,
        )
      case STEPS.fetchMessages:
        return renderLoading(
          <Box
            color="#ffffff"
            fontSize="16px"
            sx={{ lineHeight: 1.8, fontWeight: 500 }}
          >
            {`We found ${this.totalMessages} emails.`.toUpperCase()} <br />
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
                  Cc Bcc
                </Text>
              </Flex>
              <Box bg="#e3e3e6" height="1px" width="100%" />
              <Text color="#364152" fontSize={['10px', '12px']} mt={1}>
                From
              </Text>
            </Flex>
            Please do not leave this page while we are processing your To/From
            data
            <Box mt={3} width={1}>
              <Progress
                value={Math.round(
                  (fetchedMessagesCount / this.totalMessages) * 100,
                )}
              />
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

  public renderDone() {
    const { error } = this.state
    return (
      <>
        {error && <Box>Error occured</Box>}

        <Upload>
          <Text lineHeight="1.5" width={1 / 2}>
            THANK YOU!
            <br /> <br />
            Your{' '}
            <Box
              bg="white"
              color="#364152"
              fontSize="12px"
              mx="4px"
              px="8px"
              py="4px"
              sx={{ borderRadius: '4px', display: 'inline' }}
            >
              To/From
            </Box>{' '}
            information has been uploaded to our secure Amazon servers where it
            is being processed for helping you and your network. <br /> <br />
            We will send you an email once it is complete.
            <br />
          </Text>
          <Button
            bg="white"
            color="#364152"
            mx={0}
            my={4}
            px={4}
            py={2}
            type="button"
            onClick={this.handleGoToApp}
          >
            Open NetworkOs
          </Button>
        </Upload>
      </>
    )
  }

  public render() {
    const { googleAuth, error, done } = this.state

    if (done) {
      return this.renderDone()
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
          <>
            <Card
              bg="#ffffff"
              color="#364152"
              mb={3}
              mt={5}
              p="24px"
              sx={{
                borderRadius: '8px',
                maxWidth: '788px',
              }}
              width={['auto', 'auto', '788px']}
            >
              <Text color="#db3a7b" fontSize={[3, 4]} fontWeight="bold" mb={2}>
                We only read:
              </Text>
              <Flex alignSelf="center" justifyContent="center">
                <Image src="/static/data.png" width={['240px', 'auto']} />
              </Flex>
              <Flex
                bg="#fafbfd"
                flexDirection="column"
                mb={1}
                mt={3}
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
                    Cc Bcc
                  </Text>
                </Flex>
                <Box bg="#e3e3e6" height="1px" width="100%" />
                <Text color="#364152" fontSize={['10px', '12px']} mt={1}>
                  From
                </Text>
              </Flex>
              <DescriptionText fontSize={['12px', '16px']} mt={[3, 4]}>
                <Bold>
                  THIS INFORMATION IS CRITICAL
                  <br />
                  TO UNDERSTANDING YOUR NETWORK AND HELP YOU SUCCEED.
                </Bold>
                <br /> <br />
                We have published open source version of{' '}
                <a
                  href="https://github.com/Collaborations-ps/humanos-acquisition/blob/master/server/services/socket.js#L45"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  our code
                </a>{' '}
                to prove
                <br />
                <Accent>
                  we will never touch the content of your email
                </Accent>{' '}
                (that’s Google and Microsoft’s job)
                <br /> <br />
                We know it is worth it, we hope you will trust us to help you
                improve your impact.
                <br /> <br />
                <Bolder>Yes, it’s a little scary, but</Bolder> <br />
                - You remain in control <br />
                - Turn it off anytime <br />- The Mail program on your phone and
                computer uses the same technology
                <br /> <br />
              </DescriptionText>
              <Flex justifyContent="space-between" my={3}>
                <DescriptionText>
                  Contact us if you have questions:
                  <br />
                  <Link
                    color="#449aff"
                    href="mailto:info@collaboration.ai"
                    sx={{ textDecoration: 'none' }}
                  >
                    info@collaboration.ai
                  </Link>{' '}
                  +16517607717
                </DescriptionText>
                <DescriptionText textAlign="right">
                  Read our{' '}
                  <Link
                    color="#449aff"
                    href="https://www.collaboration.ai/terms.html"
                    sx={{ textDecoration: 'none' }}
                  >
                    Privacy Policy
                  </Link>
                  <br />
                  to hold us to our word.
                </DescriptionText>
              </Flex>
            </Card>
            <Flex mt={2}>
              <Button
                bg="#449aff"
                color="#ffffff"
                mx={2}
                my={0}
                type="button"
                onClick={this.handleGoToApp}
              >
                Go to Dashboard
              </Button>
              <GoogleLogin
                className="googleLogin"
                clientId={publicRuntimeConfig.GOOGLE_CLIENT_ID}
                cookiePolicy="single_host_origin"
                prompt="consent"
                scope="https://mail.google.com/"
                onFailure={this.handleFailureLogin}
                onSuccess={this.handleSuccessLogin}
              />
            </Flex>
          </>
        )}
      </>
    )
  }
}

export default App
