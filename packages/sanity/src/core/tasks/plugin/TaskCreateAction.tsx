import {TaskIcon} from '@sanity/icons'
import {useCallback} from 'react'

import {type DocumentActionDescription} from '../../config/document/actions'
import {useTranslation} from '../../i18n/hooks/useTranslation'
import {useTasksEnabled} from '../context/enabled/useTasksEnabled'
import {useTasksNavigation} from '../context/navigation/useTasksNavigation'
import {tasksLocaleNamespace} from '../i18n'

export function TaskCreateAction(): DocumentActionDescription | null {
  const {handleOpenTasks, setViewMode} = useTasksNavigation()
  const {enabled} = useTasksEnabled()

  const handleCreateTaskFromDocument = useCallback(() => {
    handleOpenTasks()
    setViewMode({type: 'create'})
  }, [handleOpenTasks, setViewMode])

  const {t} = useTranslation(tasksLocaleNamespace)

  if (!enabled) return null

  return {
    icon: TaskIcon,
    label: t('actions.create.text'),
    title: t('actions.create.text'),
    group: ['paneActions'],
    onHandle: handleCreateTaskFromDocument,
  }
}
