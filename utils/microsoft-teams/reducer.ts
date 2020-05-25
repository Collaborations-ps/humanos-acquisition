export interface Action {
  type: string
  payload?: any
  error?: Error
}

export const actionTypes = {
  AUTHORIZE_START: 'AUTHORIZE_START',
  CHANNELS_FETCH_START: 'CHANNELS_FETCH_START',
  CHANNELS_FETCH_SUCCESS: 'CHANNELS_FETCH_SUCCESS',
  ERROR: 'ERROR',
  FETCH_SUCCESS: 'FETCH_SUCCESS',
  GROUPS_FETCH_START: 'GROUPS_FETCH_START',
  GROUPS_FETCH_SUCCESS: 'GROUPS_FETCH_SUCCESS',
  MESSAGES_FETCH_START: 'MESSAGES_FETCH_START',
  WRONG_EMAIL: 'WRONG_EMAIL',
}

export enum FetchingStage {
  notStarted = 'notStarted',
  authorizing = 'authorizing',
  fetchingGroups = 'fetchingGroups',
  fetchingChannels = 'fetchingChannels',
  fetchingMessages = 'fetchingMessages',
  done = 'done',
  error = 'error',
}

interface State {
  channelsCount: number
  error: Error | null
  fetchingStage: FetchingStage
  groupsCount: number
  wrongEmail: string | null
}
export const initialState: State = {
  channelsCount: 0,
  error: null,
  fetchingStage: FetchingStage.notStarted,
  groupsCount: 0,
  wrongEmail: null,
}

export function reducer(state: State, action: Action): State {
  if (action.type === actionTypes.AUTHORIZE_START) {
    return {
      ...state,
      error: null,
      groupsCount: 0,
      channelsCount: 0,
      fetchingStage: FetchingStage.authorizing,
    }
  }
  if (action.type === actionTypes.CHANNELS_FETCH_START) {
    return {
      ...state,
      fetchingStage: FetchingStage.fetchingChannels,
    }
  }
  if (action.type === actionTypes.CHANNELS_FETCH_SUCCESS) {
    return {
      ...state,
      channelsCount: action.payload as number,
    }
  }
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
  if (action.type === actionTypes.GROUPS_FETCH_START) {
    return {
      ...state,
      fetchingStage: FetchingStage.fetchingGroups,
    }
  }
  if (action.type === actionTypes.GROUPS_FETCH_SUCCESS) {
    return {
      ...state,
      groupsCount: action.payload as number,
    }
  }
  if (action.type === actionTypes.MESSAGES_FETCH_START) {
    return {
      ...state,
      fetchingStage: FetchingStage.fetchingMessages,
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
