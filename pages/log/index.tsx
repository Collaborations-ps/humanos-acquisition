import React, { PureComponent } from 'react'
import { DateTime } from 'luxon'

interface LogEntity {
  date: DateTime
  value: string
}

interface State {
  log: LogEntity[]
  shown: boolean
}

class Log extends PureComponent<{}, State> {
  public state = {
    log: [],
    shown: true,
  }

  public add = (value: string) => {
    this.setState(state => ({
      log: [...state.log, { date: DateTime.local(), value }],
    }))
  }

  public handleToggle = () => {
    this.setState(state => ({
      shown: !state.shown,
    }))
  }

  public render() {
    const { log, shown } = this.state

    return (
      <div className={`log${shown ? '' : ' closed'}`}>
        <div
          className="log-header"
          role="button"
          tabIndex={0}
          onClick={this.handleToggle}
          onKeyDown={this.handleToggle}
        >
          Log
        </div>

        <div className="log-content">
          {log.map((entity: LogEntity) => (
            <div key={entity.value}>
              {'>'} [{entity.date.toFormat('hh:mm:ss.SSS')}] {entity.value}
            </div>
          ))}
        </div>
      </div>
    )
  }
}

export default Log
