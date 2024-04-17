import {Card, Container, Flex, Heading, Stack, Text} from '@sanity/ui'

// eslint-disable-next-line boundaries/element-types
import {HighlightSpan} from '../../../../../structure/comments'
import {UserPresenceCursor} from '../presence-cursors/UserPresenceCursor'

const user1 = (
  <UserPresenceCursor
    boundaryElement={null}
    user={{id: 'p8xDvUMxC', displayName: 'Pedro Bonamin'}}
  />
)

const user2 = (
  <UserPresenceCursor
    boundaryElement={null}
    user={{id: 'p8U8TipFc', displayName: 'Herman Wikner'}}
  />
)

const user3 = (
  <UserPresenceCursor
    boundaryElement={null}
    user={{id: 'pJnhH8iJq', displayName: 'Kayla Callfas'}}
  />
)

const user4 = (
  <UserPresenceCursor
    boundaryElement={null}
    user={{id: 'pJHJAZp6o', displayName: 'Nina Andal Aarvik'}}
  />
)

const user5 = (
  <UserPresenceCursor
    boundaryElement={null}
    user={{id: 'pZyoPHKUs', displayName: 'Per-Kristian Nordnes'}}
  />
)

const user6 = (
  <UserPresenceCursor
    boundaryElement={null}
    user={{id: 'ppHbfjdoZr', displayName: 'Fred Carlsen'}}
  />
)

const user7 = (
  <UserPresenceCursor boundaryElement={null} user={{id: 'peiHzOCZb', displayName: 'Tommy Petty'}} />
)

function Editor() {
  return (
    <Stack space={5}>
      <Heading size={3}>Introducing: User Presence C{user4}ursors</Heading>

      <Text>
        We are introducing a new feature tha{user2}t allows you to see where other users are
        currently editing in the document. This is a great way to avoid conflicts and collaborat
        {user5}e in real-time.
      </Text>

      <Text>
        Keep an ey{user1}e out for the{' '}
        <HighlightSpan data-inline-comment-state="added" data-inline-comment-nested="false">
          colored dot{user7}s
        </HighlightSpan>{' '}
        and lines that indicate where other users are currently editing. Hover over the dots{user6}{' '}
        to see who is editin{user3}g that part of the document.
      </Text>
    </Stack>
  )
}

export default function UserPresenceCursorStory() {
  return (
    <Flex height="fill">
      <Stack flex={1}>
        <Card scheme="light" shadow={1}>
          <Container width={1} paddingX={6} paddingY={7} sizing="border">
            <Editor />
          </Container>
        </Card>

        <Card scheme="dark" shadow={1}>
          <Container width={1} paddingX={6} paddingY={7} sizing="border">
            <Editor />
          </Container>
        </Card>
      </Stack>
    </Flex>
  )
}