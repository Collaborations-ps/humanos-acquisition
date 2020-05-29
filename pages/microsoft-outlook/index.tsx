import React, { Fragment, useReducer, useCallback } from 'react'
import { Box, Button, Flex, Image, Text } from 'rebass'

import includes from 'lodash/includes'
import map from 'lodash/map'

import Done from '../../components/Done'
import Error from '../../components/Error'
import Information from '../../components/Information'
import WrongEmail from '../../components/WrongEmail'

import { handleGoToApp } from '../../utils'
import { fetchMessages, chooseAnotherAccount } from '../../utils/microsoft-outlook/actions'
import { reducer, initialState, FetchingStage } from '../../utils/microsoft-outlook/reducer'
import { Loading, Overlay } from '../../utils/styles'

interface Props {
  emails?: string[]
}

function isFetchingStage(fetchingStage: FetchingStage) {
  return includes([
    FetchingStage.authorizing,
    FetchingStage.fetchingMessages,
  ], fetchingStage)
}

export default function MicrosoftTeamsPage(props: Props) {
  const { emails } = props
  const [state, dispatch] = useReducer(reducer, initialState)

  const connectData = useCallback(() => {
    fetchMessages({ dispatch, emails })
  }, [emails])

  const onChooseAnother = useCallback(() => {
    chooseAnotherAccount({ dispatch, emails })
  }, [emails])

  if (state.error) {
    return <Error error={state.error.message} />
  }

  if (state.wrongEmail && emails) {
    return <WrongEmail email={state.wrongEmail} emails={emails} onChooseAnother={onChooseAnother} />
  }

  const isDone = state.fetchingStage === FetchingStage.done

  if (isDone) {
    return <Done infoText="From/To/Cc/Bcc" />
  }

  const isFetching = isFetchingStage(state.fetchingStage)

  if (isFetching) {
    return (
      <Overlay>
        <Loading>
          <Image alt="loader" mb={4} src="/static/loader.svg" />
          {state.fetchingStage === FetchingStage.authorizing ? 'Waiting for authorization...' : null}
          {state.fetchingStage === FetchingStage.fetchingMessages ? `Loading ${state.messagesCount} messages...` : null}
        </Loading>
      </Overlay>
    );
  }

  return (
    <Fragment>
      <Information>
        <Flex
          bg="#fafbfd"
          flexDirection="column"
          my={3}
          px={3}
          py={2}
          sx={{
            borderRadius: '8px',
            border: '1px solid #e3e3e6',
          }}
        >
          <Flex justifyContent="space-between" mb={1}>
            <Text color="#364152" fontSize={['10px', '12px']}>
              To
            </Text>
            <Text color="#364152" fontSize={['10px', '12px']}>
              Cc/Bcc
            </Text>
          </Flex>
          <Box bg="#e3e3e6" height="1px" width="100%" />
          <Flex justifyContent="space-between" mb={1}>
            <Text color="#364152" fontSize={['10px', '12px']} mt={1}>
              From
            </Text>
            <Text color="#364152" fontSize={['10px', '12px']} mt={1}>
              Date
            </Text>
          </Flex>
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
          onClick={connectData}
          disabled={isFetching}
        >
          Connect Data
        </Button>
      </Flex>
    </Fragment>
  );
}
