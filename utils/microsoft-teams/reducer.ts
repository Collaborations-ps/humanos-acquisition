export interface Action {
  type: string
  payload?: any
  error?: Error | string
}

export const actionTypes = {
  ERROR: 'ERROR',
  NEW_MESSAGES: 'NEW_MESSAGES',
  FETCH_SUCCESS: 'FETCH_SUCCESS',
  FETCH_START: 'FETCH_START',
  LOG: 'LOG',
}

interface State {
  error: string | Error | null
  messages: any[]
  fetchLog: string[]
  isFetching: boolean
}
export const initialState: State = {
  error: null,
  messages: [],
  fetchLog: ['Press "Fetch Messages". Fetch process will be displayed here'],
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
      isFetching: false,
      fetchLog: [
        ...state.fetchLog,
        'Data acquisition successfully fetched data!',
      ],
    }
  }
  if (action.type === actionTypes.FETCH_START) {
    return {
      ...state,
      fetchLog: ['Data acquisition started!'],
      isFetching: true,
      messages: [],
    }
  }
  if (action.type === actionTypes.LOG) {
    return {
      ...state,
      fetchLog: [...state.fetchLog, action.payload as string],
    }
  }
  throw new Error(`Action type "${action.type}" is not supported`)
}
