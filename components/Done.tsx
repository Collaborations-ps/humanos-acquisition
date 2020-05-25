import React from 'react'
import PropTypes from 'prop-types'
import { Box, Button, Text } from 'rebass'

import { Upload } from '../utils/styles'

import { handleGoToApp } from '../utils'

interface DoneProps {
  infoText: string
  error?: string | boolean
}

function Done({ error, infoText }: DoneProps) {
  return (
    <>
      {error && <Box>Error occured</Box>}

      <Upload>
        <Text lineHeight="1.5" width={1 / 2}>
          THANK YOU!
          <br /> <br />
          Your{' '}
          <Box
            bg="white"
            color="#364152"
            fontSize="12px"
            mx="4px"
            px="8px"
            py="4px"
            sx={{ borderRadius: '4px', display: 'inline' }}
          >
            {infoText}
          </Box>{' '}
          information has been uploaded to our secure Amazon servers where it is
          being processed for helping you and your network. <br /> <br />
          We will send you an email once it is complete.
          <br />
        </Text>
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
      </Upload>
    </>
  )
}

Done.defaultProps = {
  error: null,
  infoText: 'Third party',
}

Done.propTypes = {
  error: PropTypes.bool,
  infoText: PropTypes.string
}

export default Done
