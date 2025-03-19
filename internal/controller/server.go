package controller

import (
	"net/http"

	"github.com/nicholasngai/react-template/internal/middlewares"
)

func Handler() http.Handler {
	mux := http.NewServeMux()

	// Routes.
	mux.Handle("/", http.FileServer(defaultIndexHTMLFileSystem{http.Dir("www")}))
	mux.Handle("/api/helloworld", http.HandlerFunc(HelloWorldHandler))

	// Middleware.
	var handler http.Handler = mux
	handler = middlewares.Logger(handler)

	return handler
}
