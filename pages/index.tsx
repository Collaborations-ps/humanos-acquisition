import React, { PureComponent } from 'react'
import {
  GoogleLoginResponse,
  GoogleLoginResponseOffline,
} from 'react-google-login'
import axios from 'axios'
import openSocket from 'socket.io-client'
import qs from 'qs'

import get from 'lodash/get'
import sampleSize from 'lodash/sampleSize'

import { Box, Image, Flex, Card, Text, Link, Button } from 'rebass'

import {
  GoogleLogin,
  Example,
  Upload,
  Loading,
  Header,
  Overlay,
  Pre,
  DescriptionText,
  Accent,
  Bolder,
  Bold,
} from '../utils/styles'

import { parseMessages } from '../utils'
import localApi, { Mailbox } from '../utils/localApi'
import { publicRuntimeConfig } from '../utils/config'
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
    <Loading>
      <Image alt="loader" mb={4} src="/static/loader.svg" /> {children}
    </Loading>
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

  public socket: any = null

  public async componentDidMount() {
    if (sessionStorage) {
      const googleData = sessionStorage.getItem('google')

      if (googleData) {
        const googleAuth = JSON.parse(googleData)
        this.setState(
          {
            googleAuth: JSON.parse(googleData),
            step: STEPS.findingMailbox,
          },
          async () => {
            this.socket = openSocket('/', { query: qs.stringify(googleAuth) })

            this.socket.on('connect', () => {
              console.log('connected', this.socket)
              this.socket.emit('mailboxes', { data: 'test' })
            })

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

  private handleGoToApp = () => {
    window.open(publicRuntimeConfig.WEB_URL, '_self')
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
          <Upload>
            <Text width={1}>
              We have fetched from/to information for all messages in your inbox
              (total: {this.messages.length}, see data sample{' '}
              <Link color="#ffffff" href="#" onClick={this.handleToggleExample}>
                here
              </Link>
              )
              <br />
              <br />
              Do you want to Continue and upload them to HumanOS?
            </Text>
            <Button
              bg="#449aff"
              color="#ffffff"
              mx={0}
              my={4}
              type="button"
              onClick={this.handleGenerateAndUploadFile}
            >
              Upload
            </Button>
          </Upload>
        )
      case STEPS.signingFile:
        return renderLoading(`Signing metadata file to upload...`)
      case STEPS.uploadingFile:
        return renderLoading(`Uploading metadata file...`)
      case STEPS.notifyApp:
        return renderLoading(`Notify application about upload...`)
      case STEPS.done:
        return (
          <Upload>
            <Text width={1}>
              Your data has been uploaded. <br />
              It will take some time to process it. <br />
              We will notify via email once it is done. <br />
              You can use the App in the meantime.
            </Text>
            <Button
              bg="#449aff"
              color="#ffffff"
              mx={0}
              my={4}
              type="button"
              onClick={this.handleGoToApp}
            >
              GO TO APP
            </Button>
          </Upload>
        )
      default:
        return null
    }
  }

  public render() {
    const { googleAuth, error, exampleShown, messagesExample } = this.state

    return (
      <>
        {error && <Box>Error occured</Box>}
        {googleAuth ? (
          <>
            {exampleShown && (
              <Example>
                <Button
                  color="#db3a7b"
                  type="button"
                  onClick={this.handleToggleExample}
                >
                  close
                </Button>
                <Pre>
                  ...{'\n'}
                  {JSON.stringify(messagesExample, null, 2)}
                  {'\n'}...
                </Pre>
              </Example>
            )}
            <Overlay>{this.renderStatus()}</Overlay>
            <Header>
              <button
                className="small"
                type="button"
                onClick={this.handleLogout}
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
              mt={[5, 0]}
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
                We have published open source version of our code to prove
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
            <GoogleLogin
              className="googleLogin"
              clientId={publicRuntimeConfig.GOOGLE_CLIENT_ID}
              cookiePolicy="single_host_origin"
              scope="https://mail.google.com/"
              onFailure={this.handleFailureLogin}
              onSuccess={this.handleSuccessLogin}
            />
          </>
        )}
      </>
    )
  }
}

export default App
