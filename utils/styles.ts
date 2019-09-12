import styled from '@emotion/styled'
import { css } from '@emotion/core'
import { GoogleLogin as GoogleLoginBase } from 'react-google-login'

import { Box, Flex, Text } from 'rebass'

export const globalStyles = css`
  body {
    margin: 0;
    font-family: sans-serif;
    background: linear-gradient(124deg, rgb(212, 47, 156), rgb(228, 50, 58));
    color: #333;
    font-family: Montserrat, 'Helvetica Neue', Arial, Helvetica, sans-serif;
  }

  html,
  body,
  * {
    box-sizing: border-box;
  }

  a {
    color: #db3a7b;
  }

  button {
    font-family: inherit;
    padding: 8px 16px;
    font-size: 18px;
    border: none transparent;
    color: #db3a7b;
    background: white;
    text-decoration: none;
    border-radius: 20px;
    display: inline-block;
    zoom: 1;
    line-height: normal;
    white-space: nowrap;
    vertical-align: middle;
    text-align: center;
    cursor: pointer;
    -webkit-user-drag: none;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
    -webkit-box-sizing: border-box;
    box-sizing: border-box;
    outline: none;
  }

  button:hover {
    box-shadow: 0 0 10px white;
  }

  button:active {
    box-shadow: none;
    opacity: 0.8;
  }
`

export const Main = styled(Flex)`
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 16px;
`

export const Logo = styled.div`
  color: white;
  position: absolute;
  top: 20px;
  left: 16px;
  display: flex;
  justify-content: center;

  span {
    font-weight: 500;
  }

  img {
    width: 100px;
    margin-right: 4px;
    margin-top: -3px;
  }
`

export const Upload = styled(Flex)`
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #ffffff;
`

export const Loading = styled(Flex)`
  flex-direction: column;
  align-items: center;
  justify-content: center;
`

export const Example = styled(Box)`
  position: absolute;
  top: 8px;
  left: 8px;
  right: 8px;
  bottom: 8px;
  background: rgba(0, 0, 0, 0.8);
  border-radius: 8px;
  color: white;
  z-index: 1000;
  max-height: 100vh;
  font-size: 14px;

  pre {
    font-family: source-code-pro, Menlo, Monaco, Consolas, 'Courier New', monospace;
    background: none !important;
    overflow: scroll !important;
    max-height: calc(100vh - 16px) !important;
    border: none !important;
    padding: 32px !important;
    margin: 0 !important;
  }

  button {
    position: absolute;
    right: 16px;
    top: 16px;
    font-size: 14px;
    padding: 4px 8px;
  }

`

export const GoogleLogin = styled(GoogleLoginBase)`
  font-size: 16px !important;
  font-weight: 500 !important;
  color: #364152 !important;
  padding: 0 24px !important;
`

export const Overlay = styled(Box)`
  color: white;
`

export const Header = styled(Flex)`
  flex-direction: row;
  justify-content: flex-end;
  position: absolute;
  top: 16px;
  right: 16px;
`

export const Pre = styled.pre`
  background: #f3f3f3;
  padding: 4px;
  border: 1px solid #a3a3a3;
`

export const Block = styled(Box)`
  background: white;
  border-radius: 8px;
  padding: 16px;
`

export const DescriptionText = styled(Text)(
  {
    color: "#364152",
    
  },
)

export const Accent = styled.span`
   color: #449aff;
`

export const Bolder = styled.span`
   font-weight: 500;
`

export const Bold = styled.span`
  font-weight: bold;
`
