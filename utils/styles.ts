import styled from '@emotion/styled'
import { css } from '@emotion/core'

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

export const Main = styled.div`
  display: flex;
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
