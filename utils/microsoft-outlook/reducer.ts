export interface Action {
  type: string
  payload?: any
  error?: Error
}

export const actionTypes = {
  AUTHORIZE_START: 'AUTHORIZE_START',
  ERROR: 'ERROR',
  FETCH_SUCCESS: 'FETCH_SUCCESS',
  MESSAGES_FETCH_START: 'MESSAGES_FETCH_START',
  NEW_MESSAGES: 'NEW_MESSAGES',
  WRONG_EMAIL: 'WRONG_EMAIL',
}

export enum FetchingStage {
  notStarted = 'notStarted',
  authorizing = 'authorizing',
  fetchingMessages = 'fetchingMessages',
  done = 'done',
  error = 'error',
}

interface State {
  error: Error | null
  fetchingStage: FetchingStage
  messagesCount: number
  wrongEmail: string | null
}
export const initialState: State = {
  error: null,
  fetchingStage: FetchingStage.notStarted,
  messagesCount: 0,
  wrongEmail: null,
}

export function reducer(state: State, action: Action): State {
  if (action.type === actionTypes.AUTHORIZE_START) {
    return {
      ...state,
      error: null,
      messagesCount: 0,
      fetchingStage: FetchingStage.authorizing,
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
  if (action.type === actionTypes.MESSAGES_FETCH_START) {
    return {
      ...state,
      fetchingStage: FetchingStage.fetchingMessages,
    }
  }
  if (action.type === actionTypes.NEW_MESSAGES) {
    return {
      ...state,
      messagesCount: state.messagesCount + action.payload,
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
