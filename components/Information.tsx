import React from 'react'
import PropTypes from 'prop-types'
import {
  GoogleLoginResponse,
  GoogleLoginResponseOffline,
} from 'react-google-login'
import { Box, Button, Card, Flex, Image, Link, Text } from 'rebass'

import { handleGoToApp } from '../utils'
import { publicRuntimeConfig } from '../utils/config'
import {
  Accent,
  Bold,
  Bolder,
  DescriptionText,
  GoogleLogin,
} from '../utils/styles'

function Information({
  onLoginSuccess,
  onLoginFailure,
}: {
  onLoginSuccess: (
    response: GoogleLoginResponse | GoogleLoginResponseOffline,
  ) => void
  onLoginFailure: (error: any) => void
}) {
  return (
    <>
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
        <Flex
          bg="#fafbfd"
          flexDirection="column"
          mb={1}
          mt={3}
          px={3}
          py={2}
          sx={{
            borderRadius: '8px',
            border: '1px solid #e3e3e6',
          }}
        >
          <Flex justifyContent="space-between" mb={1}>
            <Text color="#364152" fontSize={['10px', '12px']}>
              To
            </Text>
            <Text color="#364152" fontSize={['10px', '12px']}>
              Cc
            </Text>
          </Flex>
          <Box bg="#e3e3e6" height="1px" width="100%" />
          <Flex justifyContent="space-between" mb={1}>
            <Text color="#364152" fontSize={['10px', '12px']} mt={1}>
              From
            </Text>
            <Text color="#364152" fontSize={['10px', '12px']} mt={1}>
              Date
            </Text>
          </Flex>
        </Flex>
        <DescriptionText fontSize={['12px', '16px']} mt={[3, 4]}>
          <Bold>THIS INFORMATION IS CRITICAL TO HELP YOU SUCCEED</Bold>
          <br /> <br />
          We have published open source version of{' '}
          <a
            href="https://github.com/Collaborations-ps/humanos-acquisition/"
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
              href="mailto:info@collaboration.ai"
              sx={{ textDecoration: 'none' }}
            >
              info@collaboration.ai
            </Link>{' '}
            +16517607717
          </DescriptionText>
          <DescriptionText textAlign="right">
            Read our{' '}
            <Link
              color="#449aff"
              href="https://www.collaboration.ai/terms.html"
              sx={{ textDecoration: 'none' }}
            >
              Privacy Policy
            </Link>
            <br />
            to hold us to our word.
          </DescriptionText>
        </Flex>
      </Card>
      <Flex mt={2}>
        <Button
          bg="#449aff"
          color="#ffffff"
          mx={2}
          my={0}
          type="button"
          onClick={handleGoToApp}
        >
          Go to Dashboard
        </Button>
        <GoogleLogin
          className="googleLogin"
          clientId={publicRuntimeConfig.GOOGLE_CLIENT_ID}
          cookiePolicy="single_host_origin"
          prompt="consent"
          scope="https://www.googleapis.com/auth/gmail.metadata"
          onFailure={onLoginFailure}
          onSuccess={onLoginSuccess}
        />
      </Flex>
    </>
  )
}

Information.propTypes = {
  onLoginSuccess: PropTypes.func.isRequired,
  onLoginFailure: PropTypes.func.isRequired,
}

export default Information
