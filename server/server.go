package server

import (
	"net/http"
)

func GetServer() http.Handler {
	mux := http.NewServeMux()

	// Routes.
	mux.Handle("/", http.FileServer(http.Dir("client")))

	// Middleware.
	var handler http.Handler = mux
	handler = loggerMiddleware(handler)

	return handler
}
