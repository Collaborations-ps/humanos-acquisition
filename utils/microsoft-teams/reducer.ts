interface Action {
  type: string
  payload?: any
  error?: Error | string
}

export const actionTypes = {
  ERROR: 'ERROR',
  NEW_MESSAGES: 'NEW_MESSAGES',
  FETCH_SUCCESS: 'FETCH_SUCCESS',
  FETCH_START: 'FETCH_START',
}

interface State {
  error: string | Error | null
  messages: any[]
  notice: string
  isFetching: boolean
}
export const initialState: State = {
  error: null,
  messages: [],
  notice: '',
  isFetching: false,
}

export function reducer(state: State, action: Action): State {
  if (action.type === actionTypes.ERROR) {
    return {
      ...state,
      error: action.error as string,
      isFetching: false,
    }
  }
  if (action.type === actionTypes.NEW_MESSAGES) {
    return {
      ...state,
      messages: [...state.messages, ...action.payload],
    }
  }
  if (action.type === actionTypes.FETCH_SUCCESS) {
    return {
      ...state,
      notice: 'Fetch success!',
      isFetching: false,
    }
  }
  if (action.type === actionTypes.FETCH_START) {
    return {
      ...state,
      notice: 'Fetch in progress...',
      isFetching: true,
    }
  }
  throw new Error(`Action type "${action.type}" is not supported`)
}
