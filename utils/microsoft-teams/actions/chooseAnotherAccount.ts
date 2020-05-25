import { Dispatch } from 'react'

import { Action } from '../reducer'
import { logout } from '../service'

import fetchMessages from './fetchMessages'

interface ChooseAnotherAccountParams {
  dispatch: Dispatch<Action>
  emails?: string[]
}

export default async function chooseAnotherAccount({
  dispatch,
  emails,
}: ChooseAnotherAccountParams) {
  await logout()
  await fetchMessages({ dispatch, emails })
}
