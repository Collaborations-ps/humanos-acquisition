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
}
export const initialState: State = {
  error: null,
  messages: [],
  notice: '',
}

export function reducer(state: State, action: Action): State {
  if (action.type === actionTypes.ERROR) {
    return {
      ...state,
      error: action.error as string,
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
    }
  }
  if (action.type === actionTypes.FETCH_START) {
    return {
      ...state,
      notice: 'Fetch in progress...',
    }
  }
  throw new Error(`Action type "${action.type}" is not supported`)
}
