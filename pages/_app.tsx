import React from 'react'
import App, { AppContext } from 'next/app'
import Head from 'next/head'
import { Global } from '@emotion/core'

import { publicRuntimeConfig } from '../utils/config'

import Api from '../utils/api'

import './index.css'

import { Logo, Main, globalStyles } from '../utils/styles'

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

    this.setState({
      authorized,
      loaded: true,
    })
  }

  private renderNotAuthorized() {
    const { loaded } = this.state

    return loaded ? (
      <div className="block not-authorized">
        Not authorized. Please login at{' '}
        <a href={publicRuntimeConfig.WEB_URL}>HumanOS</a>, then go back
      </div>
    ) : (
      <div className="block">Loading...</div>
    )
  }

  public render() {
    const { Component, pageProps } = this.props
    const { authorized } = this.state

    return (
      <>
        <Global styles={globalStyles} />
        <Head>
          <title>HumanOS GMail Acquisition</title>
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
            <img alt="HumanOS GMail Acquisition" src="/static/logo.svg" />
            &nbsp;&nbsp;|&nbsp;&nbsp;<span>GMail Acquisition</span>
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
