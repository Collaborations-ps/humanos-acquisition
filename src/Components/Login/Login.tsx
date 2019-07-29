import React, {Component, ReactNode} from 'react'
import { GoogleLogin } from 'react-google-login'

import styles from './Login.module.scss'

export type State = {
  messages: Array<{
    id: String,
    threadId: String
  }>,
  contacts: Array<String>
}

export class Login extends Component<{}, State> {
  state = {
    messages: [],
    contacts: []
  }

  getLoginInfo = (): any => {
    return JSON.parse(sessionStorage.getItem('google') || `{EL: ''}`)
  }

  handleSuccessLogin = (event: any): void => {
      console.log('success', event)
      const googleLoginInfo = JSON.stringify(event)
      sessionStorage.setItem('google', googleLoginInfo)
  }

  handleFailureLogin = (event: any): void => {
      console.log('fail', event)
  }

  handleFetchMessages = async (): Promise<void> => {
    const {El: userId, accessToken} = this.getLoginInfo()

    try {
      const {messages} = await fetch(`https://www.googleapis.com/gmail/v1/users/${userId}/messages`, {
        method: 'GET',
        headers:{
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        }
      }).then(response => response.json())

      this.setState({
        messages: messages,
      })
      this.fetchMessages(userId, accessToken)
    } catch (error) {
      console.warn(error)
    }
  }

  fetchMessages = async (userId: String, accessToken: String): Promise<void> => {
    const {messages} = this.state
    const contacts: Array<String> = []
    try {
      for (let index = 0; index < messages.length; index++) {
        const {id} = messages[index]
        const {payload} = await fetch(`https://www.googleapis.com/gmail/v1/users/${userId}/messages/${id}`, {
          method: 'GET',
          headers:{
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          }
        }).then(response => response.json())

        const {value} = payload.headers.find((item: {name: String, value: String}) => item.name === 'From')

        const email = value.match(/\<(.*?)\>/) !== null
          ? value.match(/\<(.*?)\>/)[1]
          : value

        contacts.push(email)
      }
    } catch (error) {
      console.warn(error)
    }

    this.setState({
      contacts: [...new Set(contacts)]
    })
  }

  render(): ReactNode {
    const {contacts} = this.state

    return (
      <div>
        <div className={styles.header}>
          <GoogleLogin
            scope="https://mail.google.com/"
            clientId="720894567388-a4n3ni07clit5drod5kue0q4qcn18kpv.apps.googleusercontent.com"
            buttonText="Login"
            onSuccess={this.handleSuccessLogin}
            onFailure={this.handleFailureLogin}
            cookiePolicy={'single_host_origin'}
          />
          <button onClick={this.handleFetchMessages}>
            Get messages
          </button>
        </div>
        {contacts.length > 0 && (
          <div>
            {contacts.map((address) => (
              <p key={address}>{address}</p>
            ))}
          </div>
        )}
      </div>
    )
  }
}
