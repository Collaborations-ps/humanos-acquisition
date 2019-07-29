import React from 'react'
import App, { Container, AppContext } from 'next/app'
import Head from 'next/head'

export default class AcquisitionApp extends App {
  public static async getInitialProps({ Component, ctx }: AppContext) {
    let pageProps = {}

    if (Component.getInitialProps) {
      pageProps = await Component.getInitialProps(ctx)
    }

    return { pageProps }
  }

  public render() {
    const { Component, pageProps } = this.props

    return (
      <Container>
        <Head>
          <title>HumanOS GMail Acquisition</title>
        </Head>
        <Component {...pageProps} />
      </Container>
    )
  }
}
