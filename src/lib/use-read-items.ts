import { useCallback, useEffect, useMemo, useState } from "react"
import type { FeedItem } from "@/lib/types"

const READ_ITEMS_STORAGE_KEY = "feedme:read-items"
const HIDE_READ_STORAGE_KEY = "feedme:hide-read"

/** link → timestamp (ms since epoch) */
type ReadItemsMap = Record<string, number>

function loadReadItems(): ReadItemsMap {
  try {
    const raw = window.localStorage.getItem(READ_ITEMS_STORAGE_KEY)
    if (raw) {
      return JSON.parse(raw) as ReadItemsMap
    }
  } catch {
    // Ignore storage failures.
  }
  return {}
}

function loadHideRead(): boolean {
  try {
    const raw = window.localStorage.getItem(HIDE_READ_STORAGE_KEY)
    if (raw !== null) {
      return raw === "true"
    }
  } catch {
    // Ignore storage failures.
  }
  return true
}

export interface UseReadItemsReturn {
  readItems: ReadItemsMap
  hideRead: boolean
  isRead: (link: string) => boolean
  markAsRead: (link: string) => void
  markAsUnread: (link: string) => void
  markAllAsRead: (links: (string | undefined)[]) => void
  toggleHideRead: () => void
  getUnreadCount: (items: FeedItem[]) => number
}

export function useReadItems(): UseReadItemsReturn {
  const [readItems, setReadItems] = useState<ReadItemsMap>(loadReadItems)
  const [hideRead, setHideRead] = useState(loadHideRead)

  useEffect(() => {
    try {
      window.localStorage.setItem(READ_ITEMS_STORAGE_KEY, JSON.stringify(readItems))
    } catch {
      // Ignore storage failures.
    }
  }, [readItems])

  useEffect(() => {
    try {
      window.localStorage.setItem(HIDE_READ_STORAGE_KEY, String(hideRead))
    } catch {
      // Ignore storage failures.
    }
  }, [hideRead])

  const isRead = useCallback(
    (link: string): boolean => link in readItems,
    [readItems],
  )

  const markAsRead = useCallback((link: string) => {
    setReadItems((prev) => ({
      ...prev,
      [link]: Date.now(),
    }))
  }, [])

  const markAsUnread = useCallback((link: string) => {
    setReadItems((prev) => {
      const next = { ...prev }
      delete next[link]
      return next
    })
  }, [])

  const markAllAsRead = useCallback((links: (string | undefined)[]) => {
    const now = Date.now()
    setReadItems((prev) => {
      const next = { ...prev }
      for (const link of links) {
        if (link) {
          next[link] = now
        }
      }
      return next
    })
  }, [])

  const toggleHideRead = useCallback(() => {
    setHideRead((prev) => !prev)
  }, [])

  const getUnreadCount = useCallback(
    (items: FeedItem[]): number => {
      let count = 0
      for (const item of items) {
        if (item.link && !(item.link in readItems)) {
          count++
        }
      }
      return count
    },
    [readItems],
  )

  return useMemo(
    () => ({
      readItems,
      hideRead,
      isRead,
      markAsRead,
      markAsUnread,
      markAllAsRead,
      toggleHideRead,
      getUnreadCount,
    }),
    [readItems, hideRead, isRead, markAsRead, markAsUnread, markAllAsRead, toggleHideRead, getUnreadCount],
  )
}
