import {type SanityDocument} from '@sanity/client'
import {Autocomplete, Badge, Card, Flex, Text} from '@sanity/ui'
import {motion} from 'framer-motion'
import {useCallback, useMemo, useState} from 'react'
import {
  set,
  type StringInputProps,
  unset,
  useFormValue,
  UserAvatar,
  type UserWithPermission,
  useUserListWithPermissions,
} from 'sanity'
import styled from 'styled-components'

type Option = {
  value: string
  label: string
  user: UserWithPermission
}

const FocusableCard = styled(Card)`
  &:focus {
    box-shadow: 0 0 0 1px var(--card-focus-ring-color);
  }
`
export function MentionUserFormField(props: StringInputProps) {
  const {value, onChange} = props

  const formValue = useFormValue([]) as SanityDocument | null

  // TODO: Fix it -  move useMentionOptions at top level into it's own provider.
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const documentValue: SanityDocument = useMemo(
    () => ({
      _id: formValue?._id,
      _type: formValue?._type,
    }),
    [formValue?._id, formValue?._type],
  )

  const mentionOptions = useUserListWithPermissions({documentValue, permission: 'read'})

  const handleChange = useCallback((userId: string) => onChange(set(userId)), [onChange])

  const asOptions = mentionOptions.data?.map((user) => ({
    value: user.id,
    label: user.displayName || user.id,
    user: user,
  }))

  const renderOption = useCallback((option: Option) => {
    const {user} = option
    return (
      <Card data-as="button" padding={2} radius={2}>
        <Flex align="center" gap={3}>
          <Flex align="center" gap={2} flex={1}>
            <UserAvatar user={user.id} size={1} />
            <Text size={1} textOverflow="ellipsis">
              {user.displayName}
            </Text>
          </Flex>

          {!user.granted && (
            <Badge fontSize={1} mode="outline">
              Unauthorized
            </Badge>
          )}
        </Flex>
      </Card>
    )
  }, [])
  const filterOption = useCallback(
    (query: string, option: Option) => option.label.toLowerCase().includes(query.toLowerCase()),
    [],
  )
  const [showMentionOptions, setShowMentionOptions] = useState(false)

  const handleShowMentionOptions = useCallback(() => setShowMentionOptions(true), [])
  const handleHideMentionOptions = useCallback(() => setShowMentionOptions(false), [])
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === 'Enter' || event.key === ' ') setShowMentionOptions(true)
      if (event.key === 'Backspace') {
        onChange(unset())
        setShowMentionOptions(true)
      }
    },
    [onChange],
  )

  const mentionedUser = useMemo(
    () => mentionOptions.data?.find((u) => u.id === value),
    [mentionOptions.data, value],
  )
  if (value && !showMentionOptions && mentionedUser) {
    return (
      <FocusableCard
        data-as="button"
        padding={1}
        radius={2}
        tabIndex={0}
        onClick={handleShowMentionOptions}
        onKeyDown={handleKeyDown}
      >
        <Flex align="center" gap={3}>
          <Flex align="center" gap={2} flex={1}>
            <motion.div initial={{opacity: 0}} animate={{opacity: 1}}>
              <UserAvatar user={mentionedUser.id} size={1} />
            </motion.div>

            <Text size={1} textOverflow="ellipsis">
              {mentionedUser.displayName}
            </Text>
          </Flex>

          {!mentionedUser.granted && (
            <Badge fontSize={1} mode="outline">
              Unauthorized
            </Badge>
          )}
        </Flex>
      </FocusableCard>
    )
  }

  return (
    <Autocomplete
      id="mentionUser"
      options={asOptions}
      autoFocus={showMentionOptions}
      value={value}
      loading={mentionOptions.loading}
      renderOption={renderOption}
      // eslint-disable-next-line react/jsx-no-bind
      renderValue={(_value, option) => option?.label || _value}
      filterOption={filterOption}
      onChange={handleChange}
      placeholder="Assign to"
      fontSize={1}
      onBlur={handleHideMentionOptions}
    />
  )
}