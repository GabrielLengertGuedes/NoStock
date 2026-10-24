/*
 * Service worker do NoStock. Faz três coisas e nada mais:
 *  - mostra o alerta de estoque que chega por push;
 *  - no toque, abre a tela do produto (ou foca a janela que já está aberta);
 *  - sem conexão, mostra a página offline em vez do erro do navegador.
 *
 * Nada da /api passa por cache: saldo antigo na tela é pior do que nenhum saldo.
 */

const CACHE = 'nostock-offline-v1'
const PAGINA_OFFLINE = '/offline.html'

self.addEventListener('install', (evento) => {
  evento.waitUntil(caches.open(CACHE).then((cache) => cache.add(PAGINA_OFFLINE)))
  self.skipWaiting()
})

self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    caches
      .keys()
      .then((nomes) => Promise.all(nomes.filter((nome) => nome !== CACHE).map((nome) => caches.delete(nome))))
      .then(() => self.clients.claim()),
  )
})

// Só a navegação entre telas: o resto (arquivos do app, API) segue direto para a rede.
self.addEventListener('fetch', (evento) => {
  if (evento.request.mode !== 'navigate') return
  evento.respondWith(fetch(evento.request).catch(() => caches.match(PAGINA_OFFLINE)))
})

self.addEventListener('push', (evento) => {
  let alerta
  try {
    alerta = evento.data.json()
  } catch {
    alerta = { titulo: 'Bioma Estoque', corpo: evento.data?.text() ?? '', url: '/m' }
  }

  evento.waitUntil(
    Promise.all([
      mostrar(alerta),
      // Tela aberta não se atualiza sozinha: avisa para ela buscar os números de novo.
      self.clients
        .matchAll({ type: 'window', includeUncontrolled: true })
        .then((janelas) => janelas.forEach((janela) => janela.postMessage({ tipo: 'estoque-mudou' }))),
    ]),
  )
})

function mostrar(alerta) {
  return self.registration.showNotification(alerta.titulo, {
      body: alerta.corpo,
      tag: alerta.tag,
      // Com a mesma tag, o alerta novo substitui o anterior; renotify faz ele tocar de novo.
      renotify: Boolean(alerta.tag),
      icon: '/icons/icone-192.png',
      badge: '/icons/badge-96.png',
      lang: 'pt-BR',
      data: { url: alerta.url || '/m' },
  })
}

self.addEventListener('notificationclick', (evento) => {
  evento.notification.close()
  const destino = new URL(evento.notification.data?.url || '/m', self.location.origin).href

  evento.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((janelas) => {
      const aberta = janelas.find((janela) => new URL(janela.url).origin === self.location.origin)
      if (!aberta) return self.clients.openWindow(destino)
      // navigate() só funciona em janela controlada por este worker; se falhar, abre outra.
      return aberta
        .focus()
        .then((janela) => janela.navigate(destino))
        .catch(() => self.clients.openWindow(destino))
    }),
  )
})
