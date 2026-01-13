/* eslint-disable */
/*
 * Mock Service Worker (1.2.3).
 * https://github.com/mswjs/msw
 *
 * Licensed under the MIT License.
 * https://github.com/mswjs/msw/blob/main/LICENSE
 */

const INTEGRITY_CHECKSUM = '263e6ee6caaad2f9ec93c3f906f1b0d7'
const IS_MOCKED_RESPONSE = Symbol('isMockedResponse')
const activeClientIds = new Set()

self.addEventListener('install', function () {
  self.skipWaiting()
})

self.addEventListener('activate', function (event) {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('message', async function (event) {
  const clientId = event.source.id
  if (!clientId || !event.data) {
    return
  }

  const { type } = event.data

  switch (type) {
    case 'KEEPALIVE_REQUEST': {
      sendToClient(clientId, {
        type: 'KEEPALIVE_RESPONSE',
      })
      break
    }
    case 'INTEGRITY_CHECK_REQUEST': {
      sendToClient(clientId, {
        type: 'INTEGRITY_CHECK_RESPONSE',
        payload: INTEGRITY_CHECKSUM,
      })
      break
    }
    case 'MOCK_ACTIVATE': {
      activeClientIds.add(clientId)
      sendToClient(clientId, {
        type: 'MOCKING_ENABLED',
        payload: true,
      })
      break
    }
    case 'MOCK_DEACTIVATE': {
      activeClientIds.delete(clientId)
      break
    }
    case 'CLIENT_CLOSED': {
      activeClientIds.delete(clientId)
      const remainingClients = await self.clients.matchAll({
        type: 'window',
      })
      if (!remainingClients.some((client) => activeClientIds.has(client.id))) {
        self.registration.unregister()
      }
      break
    }
  }
})

self.addEventListener('fetch', function (event) {
  const { request } = event

  if (request.mode === 'navigate') {
    return
  }

  if (!activeClientIds.size) {
    return
  }

  const requestId = crypto.randomUUID()
  event.respondWith(
    handleRequest(event, requestId).catch((error) => {
      return Response.error()
    })
  )
})

async function handleRequest(event, requestId) {
  const client = await self.clients.get(event.clientId)

  if (!client) {
    return fetch(event.request)
  }

  const requestClone = event.request.clone()
  const requestBody = await requestClone.arrayBuffer()

  const mockedResponse = await getResponse(client, {
    id: requestId,
    url: event.request.url,
    method: event.request.method,
    headers: Object.fromEntries(event.request.headers.entries()),
    body: requestBody,
  })

  if (mockedResponse) {
    if (mockedResponse.status === 302 && mockedResponse.headers['x-msw-intention'] === 'bypass') {
      return fetch(event.request)
    }

    const response = new Response(mockedResponse.body, {
      status: mockedResponse.status,
      statusText: mockedResponse.statusText,
      headers: mockedResponse.headers,
    })

    Object.defineProperty(response, IS_MOCKED_RESPONSE, {
      value: true,
      enumerable: true,
    })

    return response
  }

  return fetch(event.request)
}

function sendToClient(clientId, message) {
  self.clients.get(clientId).then((client) => {
    if (client) {
      client.postMessage(message)
    }
  })
}

function getResponse(client, payload) {
  return new Promise((resolve) => {
    const channel = new MessageChannel()

    channel.port1.onmessage = (event) => {
      const { mockResponse } = event.data
      resolve(mockResponse)
    }

    client.postMessage(
      {
        type: 'REQUEST',
        payload,
      },
      [channel.port2]
    )
  })
}
