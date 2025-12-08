/// <reference lib="webworker" />

const CACHE_NAME = "monitabits-v1";
const STATIC_CACHE_NAME = "monitabits-static-v1";

// Static assets to cache on install
const STATIC_ASSETS = ["/", "/settings", "/manifest.json", "/favicon.ico"];

// Install event - cache static assets
self.addEventListener("install", (event) => {
	event.waitUntil(
		caches.open(STATIC_CACHE_NAME).then((cache) => {
			return cache.addAll(STATIC_ASSETS);
		}),
	);
	// Activate worker immediately
	self.skipWaiting();
});

// Activate event - cleanup old caches
self.addEventListener("activate", (event) => {
	event.waitUntil(
		caches.keys().then((cacheNames) => {
			return Promise.all(
				cacheNames
					.filter((name) => name !== CACHE_NAME && name !== STATIC_CACHE_NAME)
					.map((name) => caches.delete(name)),
			);
		}),
	);
	// Take control of all pages immediately
	self.clients.claim();
});

// Fetch event - network first, fallback to cache
self.addEventListener("fetch", (event) => {
	const { request } = event;
	const url = new URL(request.url);

	// Skip non-GET requests
	if (request.method !== "GET") {
		return;
	}

	// Skip API requests - always go to network
	if (url.pathname.startsWith("/api")) {
		return;
	}

	// For page requests, try network first, then cache
	if (request.mode === "navigate") {
		event.respondWith(
			fetch(request)
				.then((response) => {
					// Cache successful responses
					if (response.ok) {
						const responseClone = response.clone();
						caches.open(CACHE_NAME).then((cache) => {
							cache.put(request, responseClone);
						});
					}
					return response;
				})
				.catch(() => {
					// Fallback to cache
					return caches.match(request).then((cachedResponse) => {
						return cachedResponse || caches.match("/");
					});
				}),
		);
		return;
	}

	// For other assets, try cache first, then network
	event.respondWith(
		caches.match(request).then((cachedResponse) => {
			if (cachedResponse) {
				// Return cached response and update cache in background
				fetch(request)
					.then((response) => {
						if (response.ok) {
							caches.open(CACHE_NAME).then((cache) => {
								cache.put(request, response);
							});
						}
					})
					.catch(() => {
						// Network failed, that's ok - we have cache
					});
				return cachedResponse;
			}

			// No cache, try network
			return fetch(request).then((response) => {
				if (response.ok) {
					const responseClone = response.clone();
					caches.open(CACHE_NAME).then((cache) => {
						cache.put(request, responseClone);
					});
				}
				return response;
			});
		}),
	);
});
