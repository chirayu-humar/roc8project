'use client'
import React from 'react'
// ... existing imports and code ...

import { useEffect, useState, useCallback } from 'react'
import { format } from 'date-fns'

interface Email {
  id: string
  from: {
    email: string
    name: string
  }
  date: number
  subject: string
  short_description: string
  body?: string
}

interface EmailState {
  read: Set<string>
  favorites: Set<string>
}

function App() {
  const [emails, setEmails] = useState<Email[]>([])
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null)
  const [emailBody, setEmailBody] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [filter, setFilter] = useState<'all' | 'unread' | 'read' | 'favorites'>('all')
  const [emailState, setEmailState] = useState<EmailState>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('emailState')
      if (saved) {
        const parsed = JSON.parse(saved)
        return {
          read: new Set(parsed.read),
          favorites: new Set(parsed.favorites)
        }
      }
    }
    return {
      read: new Set<string>(),
      favorites: new Set<string>()
    }
  })

  const fetchEmails = useCallback(async () => {
    try {
      const response = await fetch(`https://flipkart-email-mock.now.sh/?page=${page}`)
      const data = await response.json()
      setEmails(data.list)
      setLoading(false)
    } catch (error) {
      console.error('Error fetching emails:', error)
      setLoading(false)
    }
  }, [page])

  useEffect(() => {
    fetchEmails()
  }, [page])

  useEffect(() => {
    localStorage.setItem('emailState', JSON.stringify({
      read: Array.from(emailState.read),
      favorites: Array.from(emailState.favorites)
    }))
  }, [emailState])

  // const fetchEmails = async () => {
  //   try {
  //     const response = await fetch(`https://flipkart-email-mock.now.sh/?page=${page}`)
  //     const data = await response.json()
  //     setEmails(data.list)
  //     setLoading(false)
  //   } catch (error) {
  //     console.error('Error fetching emails:', error)
  //     setLoading(false)
  //   }
  // }

  const fetchEmailBody = async (id: string) => {
    try {
      const response = await fetch(`https://flipkart-email-mock.vercel.app/?id=${id}`)
      const data = await response.json()
      setEmailBody(data.body)
    } catch (error) {
      console.error('Error fetching email body:', error)
    }
  }

  const handleEmailClick = async (email: Email) => {
    setSelectedEmail(email)
    await fetchEmailBody(email.id)
    setEmailState(prev => ({
      ...prev,
      read: new Set(prev.read).add(email.id)
    }))
  }

  const toggleFavorite = (id: string) => {
    setEmailState(prev => {
      const newFavorites = new Set(prev.favorites)
      if (newFavorites.has(id)) {
        newFavorites.delete(id)
      } else {
        newFavorites.add(id)
      }
      return {
        ...prev,
        favorites: newFavorites
      }
    })
  }

  const filteredEmails = emails.filter(email => {
    switch (filter) {
      case 'unread':
        return !emailState.read.has(email.id)
      case 'read':
        return emailState.read.has(email.id)
      case 'favorites':
        return emailState.favorites.has(email.id)
      default:
        return true
    }
  })

  const formatDate = (timestamp: number) => {
    return format(new Date(timestamp), 'dd/MM/yyyy hh:mm a')
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex items-center gap-4">
          <span className="text-sm font-medium text-gray-700">Filter By:</span>
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`rounded-full px-4 py-1 text-sm ${
                filter === 'all' ? 'bg-primary text-primary-foreground' : 'bg-gray-200 text-gray-700'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`rounded-full px-4 py-1 text-sm ${
                filter === 'unread' ? 'bg-primary text-primary-foreground' : 'bg-gray-200 text-gray-700'
              }`}
            >
              Unread
            </button>
            <button
              onClick={() => setFilter('read')}
              className={`rounded-full px-4 py-1 text-sm ${
                filter === 'read' ? 'bg-primary text-primary-foreground' : 'bg-gray-200 text-gray-700'
              }`}
            >
              Read
            </button>
            <button
              onClick={() => setFilter('favorites')}
              className={`rounded-full px-4 py-1 text-sm ${
                filter === 'favorites' ? 'bg-primary text-primary-foreground' : 'bg-gray-200 text-gray-700'
              }`}
            >
              Favorites
            </button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-[1fr,2fr]">
          <div className="space-y-4">
            {loading ? (
              <div className="text-center">Loading...</div>
            ) : (
              filteredEmails.map(email => (
                <button
                  key={email.id}
                  onClick={() => handleEmailClick(email)}
                  className={`w-full rounded-lg border p-4 text-left transition-colors hover:bg-gray-50 ${
                    selectedEmail?.id === email.id ? 'border-primary' : 'border-gray-200'
                  } ${emailState.read.has(email.id) ? 'bg-gray-50' : 'bg-white'}`}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-lg font-semibold text-primary-foreground">
                      {email.from.name[0].toUpperCase()}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">
                          From: {email.from.name} &lt;{email.from.email}&gt;
                        </p>
                        <span className="text-sm text-gray-500">{formatDate(email.date)}</span>
                      </div>
                      <p className="font-medium">Subject: {email.subject}</p>
                      <p className="text-sm text-gray-600">{email.short_description}</p>
                      {emailState.favorites.has(email.id) && (
                        <p className="text-sm text-primary">Favorite</p>
                      )}
                    </div>
                  </div>
                </button>
              ))
            )}
            <div className="flex justify-center gap-4 pt-4">
              <button
                onClick={() => setPage(1)}
                disabled={page === 1}
                className="rounded px-4 py-2 text-sm font-medium disabled:opacity-50"
              >
                Page 1
              </button>
              <button
                onClick={() => setPage(2)}
                disabled={page === 2}
                className="rounded px-4 py-2 text-sm font-medium disabled:opacity-50"
              >
                Page 2
              </button>
            </div>
          </div>

          {selectedEmail && (
            <div className="rounded-lg border border-gray-200 bg-white p-6">
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-xl font-semibold text-primary-foreground">
                    {selectedEmail.from.name[0].toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">{selectedEmail.subject}</h2>
                    <p className="text-sm text-gray-600">{formatDate(selectedEmail.date)}</p>
                  </div>
                </div>
                <button
                  onClick={() => toggleFavorite(selectedEmail.id)}
                  className={`rounded-full px-6 py-2 ${
                    emailState.favorites.has(selectedEmail.id)
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {emailState.favorites.has(selectedEmail.id) ? 'Favorited' : 'Mark as favorite'}
                </button>
              </div>
              <div
                className="prose max-w-none"
                dangerouslySetInnerHTML={{ __html: emailBody }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default App;