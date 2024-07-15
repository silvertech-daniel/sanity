import {Card} from '@sanity/ui'
import {type ForwardedRef, forwardRef, useMemo} from 'react'
import {getPublishedId, type PreviewValue, SanityDefaultPreview} from 'sanity'
import {IntentLink} from 'sanity/router'

interface ReleaseDocumentPreviewProps {
  documentId: string
  documentTypeName: string
  releaseName: string
  previewValues: PreviewValue
  isLoading: boolean
}

export function ReleaseDocumentPreview({
  documentId,
  documentTypeName,
  releaseName,
  previewValues,
  isLoading,
}: ReleaseDocumentPreviewProps) {
  const LinkComponent = useMemo(
    () =>
      // eslint-disable-next-line @typescript-eslint/no-shadow
      forwardRef(function LinkComponent(linkProps, ref: ForwardedRef<HTMLAnchorElement>) {
        return (
          <IntentLink
            {...linkProps}
            intent="edit"
            params={{
              id: getPublishedId(documentId, true),
              type: documentTypeName,
            }}
            searchParams={[['perspective', `bundle.${releaseName}`]]}
            ref={ref}
          />
        )
      }),
    [documentId, documentTypeName, releaseName],
  )

  return (
    <Card as={LinkComponent} radius={2} data-as="a">
      <SanityDefaultPreview {...previewValues} isPlaceholder={isLoading} />
    </Card>
  )
}
