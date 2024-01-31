import {useCallback, useEffect, useMemo, useState} from 'react'
import scrollIntoViewIfNeeded, {StandardBehaviorOptions} from 'scroll-into-view-if-needed'

const SCROLL_INTO_VIEW_IF_NEEDED_OPTIONS: StandardBehaviorOptions = {
  behavior: 'smooth',
  block: 'start',
  inline: 'nearest',
  scrollMode: 'if-needed',
}

/**
 * A utility function that can be used to generate a valid attribute value
 * based on the given ID.
 *
 * Generate a value that can be used as an attribute value in HTML based
 * on the given ID. This is needed because, when we use the path of a field
 * as a data attribute value, we need to escape the value so that it can be
 * queried using `querySelector`.
 *
 * Example:
 *
 * ```js
 * const validId = generateValidAttrValue('[field[_key=="title"]')
 *
 * return <div data-field-id={validId}>...</div>
 * ```
 */
function generateValidAttrValue(id: string): string {
  return id.replace(/[!"#$%&'()*+,./:;<=>?@[\\\]^`{|}~]/g, '\\$&')
}

export function generateCommentsCommentIdAttr(
  id: string,
): Record<'data-comments-comment-id', string> {
  return {
    'data-comments-comment-id': generateValidAttrValue(id),
  }
}

export function generateCommentsFieldIdAttr(id: string): Record<'data-comments-field-id', string> {
  return {
    'data-comments-field-id': generateValidAttrValue(id),
  }
}

export function generateCommentsGroupIdAttr(id: string): Record<'data-comments-group-id', string> {
  return {
    'data-comments-group-id': generateValidAttrValue(id),
  }
}

interface CommentsScrollHookValue {
  /**
   * Scroll to the comment with the given ID.
   */
  scrollToComment: (commentId: string) => void
  /**
   * Scroll to the field with the given ID.
   */
  scrollToField: (fieldId: string) => void
  /**
   * Scroll to the group with the given ID.
   */
  scrollToGroup: (groupId: string) => void
}

interface CommentsScrollHookOptions {
  boundaryElement?: HTMLElement | null
}

interface ScrollTarget {
  type: 'comment' | 'field' | 'group'
  id: string
}

export function useCommentsScroll(opts?: CommentsScrollHookOptions): CommentsScrollHookValue {
  const {boundaryElement} = opts || {}
  const [scrollTarget, setScrollTarget] = useState<ScrollTarget | null>(null)

  const scrollOpts: StandardBehaviorOptions = useMemo(
    () => ({
      ...SCROLL_INTO_VIEW_IF_NEEDED_OPTIONS,
      boundary: boundaryElement,
    }),
    [boundaryElement],
  )

  const handleScrollToComment = useCallback((commentId: string) => {
    setScrollTarget({type: 'comment', id: commentId})
  }, [])

  const handleScrollToGroup = useCallback((threadId: string) => {
    setScrollTarget({type: 'group', id: threadId})
  }, [])

  const handleScrollToField = useCallback((fieldPath: string) => {
    setScrollTarget({type: 'field', id: fieldPath})
  }, [])

  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      if (!scrollTarget) return

      const {type, id} = scrollTarget

      const element = document?.querySelector(
        `[data-comments-${type}-id="${generateValidAttrValue(id)}"]`,
      )

      if (element) {
        scrollIntoViewIfNeeded(element, scrollOpts)
      }
    })

    return () => {
      cancelAnimationFrame(raf)
    }
  }, [scrollOpts, scrollTarget])

  const value = useMemo(
    (): CommentsScrollHookValue => ({
      scrollToComment: handleScrollToComment,
      scrollToField: handleScrollToField,
      scrollToGroup: handleScrollToGroup,
    }),
    [handleScrollToComment, handleScrollToField, handleScrollToGroup],
  )

  return value
}
