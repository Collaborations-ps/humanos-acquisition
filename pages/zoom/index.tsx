import React, { Fragment, useCallback, useEffect, useReducer } from 'react'
import { useRouter } from 'next/router'
import { Flex, Image, Text } from 'rebass'
import includes from 'lodash/includes'

import ButtonLink from '../../components/ButtonLink'
import Done from '../../components/Done'
import Error from '../../components/Error'
import Information from '../../components/Information'
import WrongEmail from '../../components/WrongEmail'

import { publicRuntimeConfig } from '../../utils/config'
import { Loading, Overlay } from '../../utils/styles'
import { chooseAnotherAccount, fetchMeetings } from '../../utils/zoom/actions'
import { reducer, initialState, FetchingStage } from '../../utils/zoom/reducer'

interface Props {
  emails: string[]
}

function isFetchingStage(fetchingStage: FetchingStage) {
  return includes([
    FetchingStage.fetchingMeetings,
    FetchingStage.fetchingParticipants,
  ], fetchingStage)
}

export default function ZoomPage(props: Props) {
  const { emails } = props;

  const [state, dispatch] = useReducer(reducer, initialState)

  const router = useRouter()
  const { query } = router
  const { token } = query

  useEffect(() => {
    if (token) {
      fetchMeetings({ dispatch, emails, token: token as string })
    }
  }, [token])

  const onChooseAnother = useCallback(() => {
    if (token) {
      const doChoose = async () => {
        await chooseAnotherAccount({ token: token as string })
        router.push('/api/zoom')
      }
      doChoose()
    }
  }, [token])

  if (state.error) {
    return <Error error={state.error.message} />
  }

  if (state.wrongEmail && emails) {
    return <WrongEmail email={state.wrongEmail} emails={emails} onChooseAnother={onChooseAnother} />
  }

  const isDone = state.fetchingStage === FetchingStage.done

  if (isDone) {
    return <Done infoText="Meeting Participants" />
  }
  
  const isFetching = isFetchingStage(state.fetchingStage)

  if (isFetching) {
    return (
      <Overlay>
        <Loading>
          <Image alt="loader" mb={4} src="/static/loader.svg" />
          {state.fetchingStage === FetchingStage.fetchingMeetings ? `Loading ${state.meetingsCount} meetings...` : null}
          {state.fetchingStage === FetchingStage.fetchingParticipants ? `Loading ${state.participantsCount} participants from ${state.meetingsCount} meetings...` : null}
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
            Meetings
          </Text>
          <Text color="#364152" fontSize={['10px', '12px']}>
            Meeting Participants
          </Text>
        </Flex>
      </Information>
      <Flex mt={2}>
        <ButtonLink 
          href={`${publicRuntimeConfig.WEB_URL}/app/individual`}
          mx={2}
        >
          Go to Dashboard
        </ButtonLink>
        <ButtonLink href="/api/zoom" mx={2}>Connect Data</ButtonLink>
      </Flex>
    </Fragment>
  )
}
