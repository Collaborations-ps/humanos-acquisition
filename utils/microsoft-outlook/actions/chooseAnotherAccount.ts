import { Dispatch } from 'react'

import { Application, logout } from '../../../services/microsoft'

import { Action } from '../reducer'

import fetchMessages from './fetchMessages'

interface ChooseAnotherAccountParams {
  dispatch: Dispatch<Action>
  emails?: string[]
}

export default async function chooseAnotherAccount({
  dispatch,
  emails,
}: ChooseAnotherAccountParams) {
  await logout(Application.outlook)
  await fetchMessages({ dispatch, emails })
}
