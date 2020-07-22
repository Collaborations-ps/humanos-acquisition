import React, { Fragment, useReducer, useCallback } from 'react'
import { Box, Button, Flex, Image, Text } from 'rebass'
import { GetServerSideProps } from 'next'

import { google } from "googleapis"
import { GoogleToken } from "gtoken"
import path from "path"
// import { authenticate } from "@google-cloud/local-auth"

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
    FetchingStage.signingFile,
    FetchingStage.uploadingFile,
    FetchingStage.notifyApp,
  ], fetchingStage)
}

const gmail = google.gmail('v1')

async function runSample() {


  var jwtClient = new google.auth.JWT(
    'networkosserviceaccount@gmail-service-account-283908.iam.gserviceaccount.com',
    'gmail-service-account-283908-b61725e309e5.json',
    null,
    'https://www.googleapis.com/auth/gmail.metadata',
    'info@startupcraft.io',
  );
  
  // Use the JWT client to generate an access token.
  jwtClient.authorize(function(error, tokens) {
    if (error) {
      console.log("Error making request to generate access token:", error);
    } else if (tokens && (tokens.access_token === null)) {
      console.log("Provided service account does not have permission to generate access tokens");
    } else {
      var accessToken = tokens && tokens.access_token;
      console.log("accessToken", accessToken)

      console.log("Google-API Authed!");
      const gmail = google.gmail({
        version: "v1",
        auth: jwtClient
      });
      gmail.users.messages.list({
        userId: 'info@startupcraft.io'
      }, (err, messages) => {
        //will print out an array of messages plus the next page token
        console.log(err);
        console.dir(JSON.stringify(messages));
      });
  
      // See the "Using the access token" section below for information
      // on how to use the access token to send authenticated requests to
      // the Realtime Database REST API.
    }
  })
}

type Data = { emails?: string[] }

export const getServerSideProps = async () => {
  
  console.log("RUUN FOR THE EYES BOOO!")
  await runSample().catch(console.error);

  return {
    props: {
      emails: [],
    },
  }
}

export default async function MicrosoftTeamsPage(props: GetServerSideProps<typeof getServerSideProps>) {  
  const emails = ['']
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
    return <Done infoText="From/To/Cc" />
  }

  const isFetching = isFetchingStage(state.fetchingStage)

  if (isFetching) {
    return (
      <Overlay>
        <Loading>
          <Image alt="loader" mb={4} src="/static/loader.svg" />
          {state.fetchingStage === FetchingStage.authorizing ? 'Waiting for authorization...' : null}
          {state.fetchingStage === FetchingStage.fetchingMessages ? `Loading ${state.messagesCount} messages...` : null}
          {state.fetchingStage === FetchingStage.signingFile ? `Signing metadata file to upload...` : null}
          {state.fetchingStage === FetchingStage.uploadingFile ? `Uploading metadata file...` : null}
          {state.fetchingStage === FetchingStage.notifyApp ? `Notify application about upload...` : null}
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
              ToXYI2
            </Text>
            <Text color="#364152" fontSize={['10px', '12px']}>
              Cc
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
