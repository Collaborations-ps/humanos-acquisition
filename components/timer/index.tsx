import React, { PureComponent } from 'react'
import { DateTime } from 'luxon'

class Timer extends PureComponent<{
  expiresAt: number
  onTimedOut: () => void
}> {
  private interval: any = 0

  public componentDidMount() {
    this.interval = setInterval(this.handleTick, 1000)
  }

  public componentWillUnmount() {
    clearInterval(this.interval)
  }

  private handleTick = () => {
    this.forceUpdate()
  }

  public render() {
    const { expiresAt, onTimedOut } = this.props

    const diffInSeconds = DateTime.fromMillis(expiresAt).diffNow('seconds')

    if (diffInSeconds.seconds < 0) {
      onTimedOut()
      clearInterval(this.interval)
    }

    return (
      <span>
        {diffInSeconds.seconds >= 0
          ? diffInSeconds.toFormat('hh:mm:ss')
          : '00:00:00'}
      </span>
    )
  }
}

export default Timer
