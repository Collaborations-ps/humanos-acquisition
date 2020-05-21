import React from 'react'
import { Card, Flex, Image, Link, Text } from 'rebass'

import { publicRuntimeConfig } from '../utils/config'
import {
  Accent,
  Bold,
  Bolder,
  DescriptionText,
} from '../utils/styles'

// TODO: How to define react props
export default function Information (props: any) {
  return (
    <Card
      bg="#ffffff"
      color="#364152"
      mb={3}
      mt={5}
      p="24px"
      sx={{
        borderRadius: '8px',
        maxWidth: '788px',
      }}
      width={['auto', 'auto', '788px']}
    >
      <Text color="#db3a7b" fontSize={[3, 4]} fontWeight="bold" mb={2}>
        We only read:
      </Text>
      <Flex alignSelf="center" justifyContent="center">
        <Image src="/static/data.png" width={['240px', 'auto']} />
      </Flex>

      {props.children}

      <DescriptionText fontSize={['12px', '16px']} mt={[3, 4]}>
        <Bold>THIS INFORMATION IS CRITICAL TO HELP YOU SUCCEED</Bold>
        <br /> <br />
        We have published open source version of{' '}
        <a
          href={publicRuntimeConfig.REPO_URL}
          rel="noopener noreferrer"
          target="_blank"
        >
          our code
        </a>{' '}
        to prove{' '}
        <Accent>we will never touch the content of your email.</Accent>
        <br /> <br />
        We know it is worth it, we hope you will trust us to help you improve
        your impact.
        <br /> <br />
        <Bolder>Yes, it’s a little scary, but</Bolder> <br />
        - You remain in control <br />
        - Turn it off anytime
        <br /> <br />
      </DescriptionText>

      <Flex justifyContent="space-between" my={3}>
        <DescriptionText>
          Contact us if you have questions:
          <br />
          <Link
            color="#449aff"
            href={`mailto:${publicRuntimeConfig.EMAIL}`}
            sx={{ textDecoration: 'none' }}
          >
            {publicRuntimeConfig.EMAIL}
          </Link>{' '}
          {publicRuntimeConfig.PHONE}
        </DescriptionText>
        <DescriptionText textAlign="right">
          Read our{' '}
          <Link
            color="#449aff"
            href={publicRuntimeConfig.TERMS_URL}
            sx={{ textDecoration: 'none' }}
          >
            Privacy Policy
          </Link>
          <br />
          to hold us to our word.
        </DescriptionText>
      </Flex>
    </Card>
  )
}
