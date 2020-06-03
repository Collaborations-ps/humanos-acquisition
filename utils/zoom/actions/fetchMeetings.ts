/* eslint-disable @typescript-eslint/camelcase */
import { Dispatch } from 'react'
import qs from 'qs'

import compact from 'lodash/compact'
import includes from 'lodash/includes'
import isEmpty from 'lodash/isEmpty'
import map from 'lodash/map'
import uniq from 'lodash/uniq'

import { fetchZoomAPI } from '../../../services/zoom'

import { actionTypes, Action } from '../reducer'

const mapMeeting = (meeting: any) => ({
  id: meeting.id,
  created_at: meeting.created_at,
  duration: meeting.duration,
})

const mapParticipant = (participant: any) => ({
  id: participant.id,
  name: participant.name,
  user_email: participant.user_email,
})

async function* meetingsIterator(token: string) {
  let page = 1
  let pagesCount = 1
  const pageSize = 100

  do {
    // eslint-disable-next-line no-await-in-loop
    const response = await fetchZoomAPI(
      `https://api.zoom.us/v2/users/me/meetings?page_size=${pageSize}&page_number=${page}`,
      { token },
    )

    if (!response || isEmpty(response.meetings)) {
      return
    }

    yield map(response.meetings, mapMeeting)
    page = response.page_number
    pagesCount = response.page_count
  } while (page < pagesCount)
}

async function* participantsIterator(meetingId: string, token: string) {
  let nextPageToken: string | null = null
  const pageSize = 100

  do {
    const query = qs.stringify({
      page_size: pageSize,
      next_page_token: nextPageToken,
    })
    // eslint-disable-next-line no-await-in-loop
    const response = await fetchZoomAPI(
      `https://api.zoom.us/v2/past_meetings/${meetingId}/participants?${query}`,
      { token },
    )

    if (!response || isEmpty(response.participants)) {
      return
    }

    yield map(response.participants, mapParticipant)
    nextPageToken = response.next_page_token
  } while (nextPageToken)
}

interface FetchMeetingsParams {
  dispatch: Dispatch<Action>
  emails?: string[]
  token: string
}

export default async function fetchingMeetings(params: FetchMeetingsParams) {
  const { dispatch, emails, token } = params

  try {
    dispatch({ type: actionTypes.MEETINGS_FETCH_START })
    const me = await fetchZoomAPI('https://api.zoom.us/v2/users/me', { token })

    if (!includes(emails, me.email)) {
      dispatch({ type: actionTypes.WRONG_EMAIL, payload: me.email })
      return
    }

    dispatch({ type: actionTypes.MEETINGS_FETCH_START })

    const meetings: any[] = []
    const participants: any = {}
    const iterator = meetingsIterator(token)

    for await (const newMeetings of iterator) {
      meetings.push(...newMeetings)
      dispatch({ type: actionTypes.NEW_MEETINGS, payload: newMeetings.length })
    }

    const meetingIds = uniq(compact(map(meetings, 'id')))

    dispatch({ type: actionTypes.PARTICIPANTS_FETCH_START })

    for await (const meetingId of meetingIds) {
      const pIterator = participantsIterator(meetingId, token)

      for await (const newParticipants of pIterator) {
        participants[meetingId] = newParticipants
        dispatch({
          type: actionTypes.NEW_PARTICIPANTS,
          payload: newParticipants.length,
        })
      }
    }

    console.log('meetings', meetings)
    console.log('participants', participants)

    dispatch({ type: actionTypes.FETCH_SUCCESS })
  } catch (error) {
    console.error(error)
    dispatch({ type: actionTypes.ERROR, error })
  }
}
