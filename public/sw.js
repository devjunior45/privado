const CACHE_VERSION = "galeria-empregos-v1.5"
const STATIC_CACHE = `static-${CACHE_VERSION}`
const DYNAMIC_CACHE = `dynamic-${CACHE_VERSION}`

const APP_SHELL_FILES = ["/", "/feed", "/manifest.json", "/favicon.ico"]

self.addEventListener("install", (event) => {
  console.log(`[SW] Instalando ${CACHE_VERSION}...`)
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => {
        console.log("[SW] Cacheando App Shell...")
        return cache.addAll(APP_SHELL_FILES)
      })
      .catch((error) => console.error("[SW] Falha ao cachear App Shell:", error)),
  )
  self.skipWaiting()
})

self.addEventListener("activate", (event) => {
  console.log(`[SW] Ativando ${CACHE_VERSION}...`)
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
            console.log(`[SW] Removendo cache antigo: ${cacheName}`)
            return caches.delete(cacheName)
          }
        }),
      )
    }),
  )
  return self.clients.claim()
})

self.addEventListener("fetch", (event) => {
  const { request } = event
  if (!request.url.startsWith("http")) {
    return
  }

  // Estratégia: Network First para navegação de páginas
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Se a rede funcionar, atualiza o cache dinâmico
          if (response.ok) {
            caches.open(DYNAMIC_CACHE).then((cache) => {
              cache.put(request, response.clone())
            })
          }
          return response
        })
        .catch(async () => {
          // Se a rede falhar, tenta servir do cache
          const cachedResponse = await caches.match(request)
          if (cachedResponse) {
            return cachedResponse
          }
          // Como último recurso, serve a página principal offline
          return await caches.match("/")
        }),
    )
    return
  }

  // Estratégia: Stale-While-Revalidate para outros recursos (CSS, JS, Imagens)
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const networkFetch = fetch(request)
        .then((response) => {
          if (response.ok) {
            caches.open(DYNAMIC_CACHE).then((cache) => {
              cache.put(request, response.clone())
            })
          }
          return response
        })
        .catch((err) => {
          console.warn(`[SW] Falha na atualização em background para: ${request.url}`, err)
          return cachedResponse
        })

      return cachedResponse || networkFetch
    }),
  )
})
