export interface Action {
  type: string
  payload?: any
  error?: Error
}

export enum FetchingStage {
  notStarted = 'notStarted',
  fetchingMeetings = 'fetchingMeetings',
  fetchingParticipants = 'fetchingParticipants',
  done = 'done',
  error = 'error',
}

interface State {
  error: Error | null
  fetchingStage: FetchingStage
  meetingsCount: number
  participantsCount: number
  wrongEmail: string | null
}

export const actionTypes = {
  ERROR: 'ERROR',
  FETCH_SUCCESS: 'FETCH_SUCCESS',
  MEETINGS_FETCH_START: 'MEETINGS_FETCH_START',
  NEW_MEETINGS: 'NEW_MEETINGS',
  NEW_PARTICIPANTS: 'NEW_PARTICIPANTS',
  PARTICIPANTS_FETCH_START: 'PARTICIPANTS_FETCH_START',
  WRONG_EMAIL: 'WRONG_EMAIL',
}

export const initialState: State = {
  error: null,
  fetchingStage: FetchingStage.notStarted,
  meetingsCount: 0,
  participantsCount: 0,
  wrongEmail: null,
}

export function reducer(state: State, action: Action): State {
  if (action.type === actionTypes.ERROR) {
    return {
      ...state,
      error: action.error as Error,
      fetchingStage: FetchingStage.error,
    }
  }
  if (action.type === actionTypes.FETCH_SUCCESS) {
    return {
      ...state,
      fetchingStage: FetchingStage.done,
    }
  }
  if (action.type === actionTypes.MEETINGS_FETCH_START) {
    return {
      ...state,
      fetchingStage: FetchingStage.fetchingMeetings,
      meetingsCount: 0,
      participantsCount: 0,
    }
  }
  if (action.type === actionTypes.NEW_MEETINGS) {
    return {
      ...state,
      meetingsCount: state.meetingsCount + action.payload,
    }
  }
  if (action.type === actionTypes.NEW_PARTICIPANTS) {
    return {
      ...state,
      participantsCount: state.participantsCount + action.payload,
    }
  }
  if (action.type === actionTypes.PARTICIPANTS_FETCH_START) {
    return {
      ...state,
      fetchingStage: FetchingStage.fetchingParticipants,
    }
  }
  if (action.type === actionTypes.WRONG_EMAIL) {
    return {
      ...state,
      error: null,
      fetchingStage: FetchingStage.error,
      wrongEmail: action.payload as string,
    }
  }
  throw new Error(`Action type "${action.type}" is not supported`)
}
