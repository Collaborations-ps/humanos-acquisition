import React, { EventHandler, MouseEvent } from 'react'
import PropTypes from 'prop-types'
import { Box, Button, Text } from 'rebass'
import styled from '@emotion/styled'

import map from 'lodash/map'

import { Upload } from '../utils/styles'

import { handleGoToSettings } from '../utils'

const Highlight = styled(Box)`
  background: white;
  color: #364152;
  font-size: 12px;
  margin: 4px 0;
  padding: 4px 8px;
  border-radius: 4px;
  display: inline;
`

function WrongEmail({
  email,
  emails,
  onChooseAnother,
}: {
  email: string
  emails: string[]
  onChooseAnother: EventHandler<MouseEvent>
}) {
  return (
    <>
      <Upload>
        <Text lineHeight="1.5" width={1 / 2}>
          We cannot acquire email <Highlight>{email}</Highlight>, you only have
          this emails connected:{' '}
          {map(emails, item => (
            <Highlight key={item}>{item}</Highlight>
          ))}
          <br />
        </Text>
        You can:
        <Button
          bg="white"
          color="#364152"
          mx={0}
          my={3}
          px={4}
          py={2}
          type="button"
          onClick={onChooseAnother}
        >
          Acquire another email
        </Button>
        or
        <Button
          bg="white"
          color="#364152"
          mx={0}
          my={3}
          px={4}
          py={2}
          type="button"
          onClick={handleGoToSettings}
        >
          Connect this email to NetworkOS
        </Button>
      </Upload>
    </>
  )
}

WrongEmail.propTypes = {
  email: PropTypes.string.isRequired,
  emails: PropTypes.arrayOf(PropTypes.string).isRequired,
  onChooseAnother: PropTypes.func.isRequired,
}

export default WrongEmail
