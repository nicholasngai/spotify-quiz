package controller

import (
	"net/http"

	"github.com/nicholasngai/react-template/internal/middlewares"
)

func GetHandler() http.Handler {
	mux := http.NewServeMux()

	// Routes.
	mux.Handle("/", http.FileServer(http.Dir("client")))

	// Middleware.
	var handler http.Handler = mux
	handler = middlewares.Logger(handler)

	return handler
}
