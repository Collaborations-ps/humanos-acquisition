import React, { Fragment, useReducer } from 'react'
import { Button, Flex, Text } from 'rebass'

import map from 'lodash/map'

import Information from '../../components/Information'
import Error from '../../components/Error'

import { handleGoToApp } from '../../utils'
import { fetchMessages } from '../../utils/microsoft-teams/actions'
import { reducer, initialState } from '../../utils/microsoft-teams/reducer'

export default function MicrosoftTeamsPage() {
  const [state, dispatch] = useReducer(reducer, initialState)

  if (state.error) {
    return <Error error={state.error.message} />
  }

  return (
    <Fragment>
      <Information>
        <Flex
          bg="#fafbfd"
          justifyContent="space-between"
          mb={1}
          mt={3}
          px={3}
          py={2}
          sx={{
            borderRadius: '8px',
            border: '1px solid #e3e3e6',
          }}
        >
          <Text color="#364152" fontSize={['10px', '12px']}>
            Channel Message Sender
          </Text>
          <Text color="#364152" fontSize={['10px', '12px']}>
            Channel Message Mentions
          </Text>
        </Flex>
      </Information>
      <Flex mt={2}>
        <Button
          bg="#449aff"
          color="#ffffff"
          mx={2}
          my={0}
          type="button"
          onClick={handleGoToApp}
        >
          Go to Dashboard
        </Button>
        <Button
          bg="#449aff"
          color="#ffffff"
          mx={2}
          my={0}
          type="button"
          onClick={() => fetchMessages(dispatch)}
          disabled={state.isFetching}
        >
          Fetch Messages
        </Button>
      </Flex>
    </Fragment>
  );
}
