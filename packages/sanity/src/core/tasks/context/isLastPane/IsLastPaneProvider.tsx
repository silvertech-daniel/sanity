import {IsLastPaneContext} from './IsLastPaneContext'

interface IsLastPaneProviderProps {
  isLastPane: boolean
  children: React.ReactNode
}

/**
 * @internal
 * @hidden
 */
export function IsLastPaneProvider({children, isLastPane}: IsLastPaneProviderProps): JSX.Element {
  return <IsLastPaneContext.Provider value={isLastPane}>{children}</IsLastPaneContext.Provider>
}