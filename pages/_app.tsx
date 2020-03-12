import React from 'react'
import App, { AppContext } from 'next/app'
import Head from 'next/head'
import { Global } from '@emotion/core'
import * as Sentry from '@sentry/browser'

import { Image, Link } from 'rebass'

import { publicRuntimeConfig } from '../utils/config'

import Api from '../utils/api'

import { globalStyles, Logo, Main, Block } from '../utils/styles'

Sentry.init({ dsn: publicRuntimeConfig.SENTRY_DSN })

export default class AcquisitionApp extends App {
  public state = {
    loaded: false,
    authorized: false,
  }

  public static async getInitialProps({ Component, ctx }: AppContext) {
    let pageProps = {}

    if (Component.getInitialProps) {
      pageProps = await Component.getInitialProps(ctx)
    }

    return { pageProps }
  }

  public async componentDidMount() {
    const authorized = await Api.checkAuthorized()
    const emails = await Api.getMyEmails()

    console.log(emails)

    this.setState({
      authorized,
      emails,
      loaded: true,
    })
  }

  private renderNotAuthorized() {
    const { loaded } = this.state
    return loaded ? (
      <Block>
        Not authorized. Please login at{' '}
        <Link href={publicRuntimeConfig.WEB_URL}>NetworkOS</Link>, then go back
      </Block>
    ) : (
      <Block>Loading...</Block>
    )
  }

  public render() {
    const { Component, pageProps } = this.props
    const { authorized } = this.state

    return (
      <>
        <Global styles={globalStyles} />
        <Head>
          <title>NetworkOS Gmail Acquisition</title>
          <link
            href="/static/favicon.ico"
            rel="shortcut icon"
            type="image/x-icon"
          />
          <link
            data-react-helmet="true"
            href="https://fonts.googleapis.com/css?family=Montserrat:400,500,600,700"
            rel="stylesheet"
          />
        </Head>
        <Main>
          <Logo>
            <Image alt="NetworkOS Gmail Acquisition" src="/static/logo.svg" />
            &nbsp;&nbsp;|&nbsp;&nbsp;<span>Gmail Acquisition</span>
          </Logo>
          {authorized ? (
            <Component {...pageProps} />
          ) : (
            this.renderNotAuthorized()
          )}
        </Main>
      </>
    )
  }
}
