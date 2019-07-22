import React from 'react'

import logo from 'Assets/Svg/logo.svg'

import styles from './App.module.scss'

const App = () => {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <img alt="logo" className={styles.logo} src={logo} />
        <p>
          Edit <code>src/Containers/App.tsx</code> and save to reload.
        </p>
        <a
          className={styles.link}
          href="https://reactjs.org"
          rel="noopener noreferrer"
          target="_blank"
        >
          Learn React
        </a>
      </header>
    </div>
  )
}

export default App
