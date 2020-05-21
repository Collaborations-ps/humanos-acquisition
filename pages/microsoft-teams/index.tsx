import React, { Fragment, useReducer } from 'react'
import { Box, Button, Text, Card } from 'rebass'

import map from 'lodash/map'

import { fetchMessages } from '../../utils/microsoft-teams/actions'
import { reducer, initialState } from '../../utils/microsoft-teams/reducer'

export default function MicrosoftTeamsPage() {
  const [state, dispatch] = useReducer(reducer, initialState)

  if (state.error) {
    return <Box>Error occured!</Box>
  }

  return (
    <Card
      bg="#ffffff"
      color="#364152"
      mb={3}
      mt={5}
      p="24px"
      sx={{
        borderRadius: '8px',
        maxWidth: '788px',
      }}
      width={['auto', 'auto', '788px']}
    >
      <Button
        bg="#449aff"
        color="#ffffff"
        mx={0}
        mb={1}
        type="button"
        onClick={() => fetchMessages(dispatch)}
        disabled={state.isFetching}
      >
        Fetch Messages
      </Button>
      <Box
        sx={{
          overflowY: 'scroll',
          height: '8em',
          border: '1px solid #cececece',
          borderRadius: '3px',
        }}
      >
        {map(state.fetchLog, (logText, index) => (
          <Text key={index}>{logText}</Text>
        ))}
      </Box>
    </Card>
  );
}
