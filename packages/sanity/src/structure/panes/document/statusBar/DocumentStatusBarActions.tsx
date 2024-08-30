/* eslint-disable no-warning-comments */
/* eslint-disable camelcase */
import {Flex, Hotkeys, LayerProvider, Stack, Text} from '@sanity/ui'
import {memo, useCallback, useMemo, useState} from 'react'
import {
  BundleActions,
  type DocumentActionComponent,
  type DocumentActionDescription,
  type DocumentActionProps,
  isBundleDocument,
  LATEST,
  shouldArrayDialogOpen,
  usePerspective,
  useSource,
  useTimelineSelector,
} from 'sanity'

import {Button, Tooltip} from '../../../../ui-components'
import {RenderActionCollectionState, usePaneRouter} from '../../../components'
import {HistoryRestoreAction} from '../../../documentActions'
import {useDocumentPane} from '../useDocumentPane'
import {ActionMenuButton} from './ActionMenuButton'
import {ActionStateDialog} from './ActionStateDialog'

interface DocumentStatusBarActionsInnerProps {
  disabled: boolean
  showMenu: boolean
  states: DocumentActionDescription[]
  actionProps?: Omit<DocumentActionProps, 'onComplete'> | null
}

const DocumentStatusBarActionsInner = memo(function DocumentStatusBarActionsInner(
  props: DocumentStatusBarActionsInnerProps,
) {
  const {disabled, showMenu, states, actionProps} = props
  const {
    __internal_tasks,
    schemaType,
    openPath,
    documentId,
    documentType,
    documentVersions,
    formState,
  } = useDocumentPane()

  const paneRouter = usePaneRouter()
  const [firstActionState, ...menuActionStates] = states
  const [buttonElement, setButtonElement] = useState<HTMLButtonElement | null>(null)
  const isTreeArrayEditingEnabled = useSource().beta?.treeArrayEditing?.enabled

  // Disable the main document action if the array dialog is open
  const isTreeArrayEditingEnabledOpen = useMemo(() => {
    if (!isTreeArrayEditingEnabled) return false

    return shouldArrayDialogOpen(schemaType, openPath)
  }, [isTreeArrayEditingEnabled, openPath, schemaType])

  // TODO: This could be refactored to use the tooltip from the button if the firstAction.title was updated to a string.
  const tooltipContent = useMemo(() => {
    if (!firstActionState || (!firstActionState.title && !firstActionState.shortcut)) return null

    return (
      <Flex style={{maxWidth: 300}} align="center" gap={3}>
        {firstActionState.title && <Text size={1}>{firstActionState.title}</Text>}
        {firstActionState.shortcut && (
          <Hotkeys
            data-testid="document-status-bar-hotkeys"
            fontSize={1}
            style={{marginTop: -4, marginBottom: -4}}
            keys={String(firstActionState.shortcut)
              .split('+')
              .map((s) => s.slice(0, 1).toUpperCase() + s.slice(1).toLowerCase())}
          />
        )}
      </Flex>
    )
  }, [firstActionState])

  /* Version / Bundling handling */

  // TODO MAKE SURE THIS IS HOW WE WANT TO DO THIS
  const {currentGlobalBundle} = usePerspective(paneRouter.perspective)

  return (
    <Flex align="center" gap={1}>
      {__internal_tasks && __internal_tasks.footerAction}
      {firstActionState && (
        <LayerProvider zOffset={200}>
          <Tooltip disabled={!tooltipContent} content={tooltipContent} placement="top">
            <Stack>
              {currentGlobalBundle._id === LATEST._id ? (
                <Button
                  data-testid={`action-${firstActionState.label}`}
                  disabled={
                    disabled || Boolean(firstActionState.disabled) || isTreeArrayEditingEnabledOpen
                  }
                  icon={firstActionState.icon}
                  // eslint-disable-next-line react/jsx-handler-names
                  onClick={firstActionState.onHandle}
                  ref={setButtonElement}
                  text={firstActionState.label}
                  tone={firstActionState.tone || 'primary'}
                />
              ) : (
                <>
                  {
                    /** TODO DO WE STILL NEED THIS OR CAN WE MOVE THIS TO THE PLUGIN? */
                    isBundleDocument(currentGlobalBundle) && formState?.value?._id ? (
                      <BundleActions
                        currentGlobalBundle={currentGlobalBundle}
                        documentId={formState.value._id as string}
                        documentType={documentType}
                        {...actionProps}
                        key={formState.value._id as string}
                      />
                    ) : (
                      <div>
                        {/* eslint-disable-next-line i18next/no-literal-string */}
                        <Text>Not a bundle</Text>
                      </div>
                    )
                  }
                </>
              )}
            </Stack>
          </Tooltip>
        </LayerProvider>
      )}
      {/**
       * TODO DO WE STILL NEED THIS OR CAN WE MOVE THIS TO THE PLUGIN?
       * SPECIFICALLY FOR ISDRAFT
       */}
      {showMenu && menuActionStates.length > 0 && currentGlobalBundle._id === LATEST._id && (
        <ActionMenuButton actionStates={menuActionStates} disabled={disabled} />
      )}
      {firstActionState && firstActionState.dialog && (
        <ActionStateDialog dialog={firstActionState.dialog} referenceElement={buttonElement} />
      )}
    </Flex>
  )
})

export const DocumentStatusBarActions = memo(function DocumentStatusBarActions() {
  const {actions: allActions, connectionState, documentId, editState} = useDocumentPane()
  // const [isMenuOpen, setMenuOpen] = useState(false)
  // const handleMenuOpen = useCallback(() => setMenuOpen(true), [])
  // const handleMenuClose = useCallback(() => setMenuOpen(false), [])
  // const handleActionComplete = useCallback(() => setMenuOpen(false), [])

  // The restore action has a dedicated place in the UI; it's only visible when the user is viewing
  // a different document revision. It must be omitted from this collection.
  const actions = useMemo(
    () => (allActions ?? []).filter((action) => !isRestoreAction(action)),
    [allActions],
  )

  const renderDocumentStatusBarActions = useCallback<
    (props: {states: DocumentActionDescription[]}) => React.ReactNode
  >(
    ({states}) => (
      <DocumentStatusBarActionsInner
        disabled={connectionState !== 'connected'}
        // isMenuOpen={isMenuOpen}
        // onMenuOpen={handleMenuOpen}
        // onMenuClose={handleMenuClose}
        showMenu={actions.length > 1}
        states={states}
        // Use document ID as key to make sure that the actions state is reset when the document changes
        key={documentId}
        actionProps={editState}
      />
    ),
    [actions.length, connectionState, documentId, editState],
  )

  if (actions.length === 0 || !editState) {
    return null
  }

  return (
    <RenderActionCollectionState
      // component={}
      // onActionComplete={handleActionComplete}
      actions={actions}
      actionProps={editState}
      group="default"
    >
      {renderDocumentStatusBarActions}
    </RenderActionCollectionState>
  )
})

export const HistoryStatusBarActions = memo(function HistoryStatusBarActions() {
  const {actions, connectionState, editState, timelineStore} = useDocumentPane()

  // Subscribe to external timeline state changes
  const revTime = useTimelineSelector(timelineStore, (state) => state.revTime)

  const revision = revTime?.id || ''
  const disabled = (editState?.draft || editState?.published || {})._rev === revision
  const actionProps = useMemo(() => ({...(editState || {}), revision}), [editState, revision])

  // If multiple `restore` actions are defined, ensure only the final one is used.
  const historyActions = useMemo(() => (actions ?? []).filter(isRestoreAction).slice(-1), [actions])

  const renderDocumentStatusBarActions = useCallback<
    (props: {states: DocumentActionDescription[]}) => React.ReactNode
  >(
    ({states}) => (
      <DocumentStatusBarActionsInner
        disabled={connectionState !== 'connected' || Boolean(disabled)}
        showMenu={false}
        states={states}
      />
    ),
    [connectionState, disabled],
  )

  return (
    <RenderActionCollectionState
      actions={historyActions}
      actionProps={actionProps as any}
      group="default"
    >
      {renderDocumentStatusBarActions}
    </RenderActionCollectionState>
  )
})

export function isRestoreAction(
  action: DocumentActionComponent,
): action is DocumentActionComponent & {action: 'restore'} {
  return action.action === HistoryRestoreAction.action
}
