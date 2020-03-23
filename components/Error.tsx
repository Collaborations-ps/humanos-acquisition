import React from 'react'
import PropTypes from 'prop-types'
import { Button, Text } from 'rebass'

import { Upload, ErrorBlock } from '../utils/styles'

import { handleGoToApp } from '../utils'

function handleRefresh() {
  if (window) {
    window.location.reload()
  }
}

function Error({ error }: { error?: string | boolean }) {
  return (
    <Upload>
      <Text lineHeight="1.5">
        Hmmm, something goes wrong :(
        <br /> <br />
        Please reload this page to start again or try again later
      </Text>
      <Button
        bg="white"
        color="#364152"
        mt={3}
        mx={0}
        px={4}
        py={2}
        type="button"
        onClick={handleRefresh}
      >
        Reload page
      </Button>
      <Button
        bg="white"
        color="#364152"
        mx={0}
        my={4}
        px={4}
        py={2}
        type="button"
        onClick={handleGoToApp}
      >
        Open NetworkOS
      </Button>
      <ErrorBlock>
        <br />
        What happens: <code>{error}</code>
      </ErrorBlock>
    </Upload>
  )
}

Error.defaultProps = {
  error: null,
}

Error.propTypes = {
  error: PropTypes.oneOfType([PropTypes.bool, PropTypes.string]),
}

export default Error
