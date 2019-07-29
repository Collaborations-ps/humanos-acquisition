import React from 'react'

import { Login } from 'Components/Login/Login'

import styles from './App.module.scss'

const App = () => {
  return (
    <div className={styles.container}>
      <Login />
    </div>
  )
}

export default App
