import React, { Fragment, useReducer, useCallback } from 'react'
import { Button, Flex, Image, Text } from 'rebass'

import includes from 'lodash/includes'
import map from 'lodash/map'

import Done from '../../components/Done'
import Error from '../../components/Error'
import Information from '../../components/Information'
import WrongEmail from '../../components/WrongEmail'

import { handleGoToApp } from '../../utils'
import { fetchMessages, chooseAnotherAccount } from '../../utils/microsoft-teams/actions'
import { reducer, initialState, FetchingStage } from '../../utils/microsoft-teams/reducer'
import { Loading, Overlay } from '../../utils/styles'

interface Props {
  emails?: string[]
}

function isFetchingStage(fetchingStage: FetchingStage) {
  return includes([
    FetchingStage.authorizing,
    FetchingStage.fetchingGroups,
    FetchingStage.fetchingChannels,
    FetchingStage.fetchingMessages,
  ], fetchingStage)
}

export default function MicrosoftTeamsPage(props: Props) {
  // const { emails } = props
  const emails = ['Brennan.Townley@thedifferencea2c.onmicrosoft.com']
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

  // TODO: Modify Done component so it doesn't show To/From
  // Possibly add redirect to success page and stuff ?
  if (isDone) {
    return <Done infoText="Channels" />
  }

  const isFetching = isFetchingStage(state.fetchingStage)

  if (isFetching) {
    return (
      <Overlay>
        <Loading>
          <Image alt="loader" mb={4} src="/static/loader.svg" />
          {state.fetchingStage === FetchingStage.authorizing ? 'Waiting for authorization...' : null}
          {state.fetchingStage === FetchingStage.fetchingGroups ? 'Loading teams...' : null}
          {state.fetchingStage === FetchingStage.fetchingChannels ? `Loading channles for ${state.groupsCount} teams...` : null}
          {state.fetchingStage === FetchingStage.fetchingMessages ? `Loading messages for ${state.channelsCount} channels in ${state.groupsCount} teams...` : null}
        </Loading>
      </Overlay>
    );
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
          onClick={connectData}
          disabled={isFetching}
        >
          Connect Data
        </Button>
      </Flex>
    </Fragment>
  );
}
