import React, { ReactChildren } from 'react'
import { Button, Link } from 'rebass'

import { publicRuntimeConfig } from '../utils/config'

// TODO: Deal with typings

// TODO: This can be done with rebass
const themeVariants: any = {
  blue: {
    bg: '#449aff',
    color: '#ffffff',
  },
}

export default function GoToAppButton(props: any) {
  const { variant, href, children, ...rest } = props
  const themeVariant: any = themeVariants[variant] || themeVariants[GoToAppButton.defaultProps.variant]

  return (
    <Button
      bg={themeVariant.bg}
      type="button"
      {...rest}
    >
      <Link
        href={href}
        color={themeVariant.color}
        sx={{ display: 'block', textDecoration: 'none' }}
      >
        {children}
      </Link>
    </Button>
  )
}

GoToAppButton.defaultProps = {
  variant: 'blue',
}
