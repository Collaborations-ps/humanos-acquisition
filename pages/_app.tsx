import React from 'react'
import App, { Container, AppContext } from 'next/app'
import Head from 'next/head'

import Api from '../utils/api'

import './index.css'

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
        <a href="https://humanos.c8.ai">HumanOS</a>, then go back
      </div>
    ) : (
      <div className="block">Loading...</div>
    )
  }

  public render() {
    const { Component, pageProps } = this.props
    const { authorized } = this.state

    return (
      <Container>
        <Head>
          <title>HumanOS GMail Acquisition</title>
        </Head>
        <div className="main">
          {authorized ? (
            <Component {...pageProps} />
          ) : (
            this.renderNotAuthorized()
          )}
        </div>
      </Container>
    )
  }
}
