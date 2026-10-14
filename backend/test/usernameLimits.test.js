const assert = require('node:assert/strict')
const http = require('node:http')
const test = require('node:test')

const { createApp } = require('../src/app')
const analyzeRouter = require('../src/routes/analyze')
const usernameVariationsRouter = require('../src/routes/usernameVariations')
const {
  MAX_USERNAME_LENGTH,
  MAX_VARIATIONS,
  generateUsernameVariations,
  generateUsernameVariationsWithMetadata,
} = require('../src/utils/usernameGenerator')

function postJson(port, path, body) {
  const payload = JSON.stringify(body)

  return new Promise((resolve, reject) => {
    const request = http.request({
      hostname: '127.0.0.1',
      port,
      path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
      },
    }, (response) => {
      let responseBody = ''
      response.setEncoding('utf8')
      response.on('data', (chunk) => {
        responseBody += chunk
      })
      response.on('end', () => {
        resolve({ status: response.statusCode, body: JSON.parse(responseBody) })
      })
    })

    request.on('error', reject)
    request.end(payload)
  })
}

function invokeRoute(router, body) {
  return new Promise((resolve, reject) => {
    const request = {
      method: 'POST',
      url: '/',
      body,
    }
    const response = {
      statusCode: 200,
      status(statusCode) {
        this.statusCode = statusCode
        return this
      },
      json(responseBody) {
        resolve({ status: this.statusCode, body: responseBody })
        return this
      },
    }

    router.handle(request, response, reject)
  })
}

function createProviderResponse(status, data = null) {
  return {
    status,
    ok: status >= 200 && status < 300,
    headers: { get: () => null },
    json: async () => data,
    text: async () => '',
  }
}

async function withStubbedProviders(callback) {
  const originalFetch = global.fetch
  global.fetch = async (url) => (
    String(url).includes('gitlab.com/api/v4/users')
      ? createProviderResponse(200, [])
      : createProviderResponse(404)
  )

  try {
    return await callback()
  } finally {
    global.fetch = originalFetch
  }
}

test('preserves the original variation output and ordering for ordinary usernames', () => {
  assert.deepEqual(generateUsernameVariations('alice'), [
    'alice1',
    'alice12',
    'alice123',
    'alice0',
    '4l1c3',
    '4lice',
    'al1ce',
    'alic3',
    'alice_',
    '_alice',
    'al_ice',
    'a_lice',
    'ali_ce',
    'alic_e',
    'alic',
    'ali',
  ])
})

test('caps generated variations at the defensive maximum', () => {
  const { variations, capped } = generateUsernameVariationsWithMetadata('a'.repeat(MAX_USERNAME_LENGTH))

  assert.equal(variations.length, MAX_VARIATIONS)
  assert.equal(capped, true)
  assert.ok(variations.includes(`${'a'.repeat(MAX_USERNAME_LENGTH)}_`))
  assert.ok(variations.includes('a'.repeat(4)))
  assert.ok(variations.includes(`${'a'.repeat(MAX_USERNAME_LENGTH - 1)}4`))
})

test('does not generate variations beyond the global safety limit', () => {
  assert.deepEqual(generateUsernameVariations('a'.repeat(MAX_USERNAME_LENGTH + 1)), [])
})

test('accepts a GitHub-valid 39-character username on the variations route', async () => {
  const response = await invokeRoute(usernameVariationsRouter, {
    username: 'a'.repeat(39),
  })

  assert.equal(response.status, 200)
  assert.ok(response.body.variations.length <= MAX_VARIATIONS)
  assert.equal(response.body.variationsCapped, true)
})

test('accepts a 255-character username after trimming', async () => {
  const response = await invokeRoute(usernameVariationsRouter, {
    username: ` ${'a'.repeat(MAX_USERNAME_LENGTH)} `,
  })

  assert.equal(response.status, 200)
})

test('rejects oversized usernames on the variations route', async () => {
  const response = await invokeRoute(usernameVariationsRouter, {
    username: 'a'.repeat(MAX_USERNAME_LENGTH + 1),
  })

  assert.equal(response.status, 400)
  assert.equal(response.body.error, `Username must be ${MAX_USERNAME_LENGTH} characters or fewer`)
})

test('rejects oversized usernames before analyze providers run', async () => {
  const originalFetch = global.fetch
  global.fetch = async () => {
    throw new Error('Provider fetch should not be called for an invalid username')
  }

  try {
    const response = await invokeRoute(analyzeRouter, {
      mode: 'username',
      username: 'a'.repeat(MAX_USERNAME_LENGTH + 1),
    })

    assert.equal(response.status, 400)
    assert.equal(response.body.error, `Username must be ${MAX_USERNAME_LENGTH} characters or fewer`)
  } finally {
    global.fetch = originalFetch
  }
})

test('reports an uncapped variation summary for successful username scans', async () => {
  await withStubbedProviders(async () => {
    const response = await invokeRoute(analyzeRouter, {
      mode: 'username',
      username: 'alice',
    })

    assert.equal(response.status, 200)
    assert.equal(response.body.summary.variationsCapped, false)
    assert.equal(response.body.summary.totalVariations, 16)
  })
})

test('reports a capped variation summary for successful username scans', async () => {
  await withStubbedProviders(async () => {
    const response = await invokeRoute(analyzeRouter, {
      mode: 'username',
      username: 'a'.repeat(MAX_USERNAME_LENGTH),
    })

    assert.equal(response.status, 200)
    assert.equal(response.body.summary.variationsCapped, true)
    assert.equal(response.body.summary.totalVariations, MAX_VARIATIONS)
    assert.ok(response.body.originalUsernameAnalysis)
  })
})

test('rejects oversized usernames in full scan mode after trimming', async () => {
  const response = await invokeRoute(analyzeRouter, {
    mode: 'full',
    email: 'person@example.com',
    username: ` ${'a'.repeat(MAX_USERNAME_LENGTH + 1)} `,
  })

  assert.equal(response.status, 400)
  assert.equal(response.body.error, `Username must be ${MAX_USERNAME_LENGTH} characters or fewer`)
})

test('mounted app rejects oversized full scans before provider requests', async () => {
  const server = http.createServer(createApp())
  const originalFetch = global.fetch
  global.fetch = async () => {
    throw new Error('Provider fetch should not be called for an invalid username')
  }

  try {
    await new Promise((resolve, reject) => {
      server.once('error', reject)
      server.listen(0, '127.0.0.1', resolve)
    })

    const response = await postJson(server.address().port, '/api/analyze', {
      mode: 'full',
      email: 'person@example.com',
      username: 'a'.repeat(MAX_USERNAME_LENGTH + 1),
    })

    assert.equal(response.status, 400)
    assert.equal(response.body.error, `Username must be ${MAX_USERNAME_LENGTH} characters or fewer`)
  } finally {
    global.fetch = originalFetch
    if (server.listening) {
      await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())))
    }
  }
})
