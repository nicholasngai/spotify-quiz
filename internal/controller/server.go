package controller

import (
	"net/http"

	"github.com/nicholasngai/react-template/internal/middlewares"
)

type Controller struct{}

func (c Controller) Handler() http.Handler {
	mux := http.NewServeMux()

	// Routes.
	mux.Handle("GET /", http.FileServer(defaultIndexHTMLFileSystem{http.Dir("www")}))
	mux.Handle("GET /api/helloworld", http.HandlerFunc(c.HelloWorldHandler))

	// Middleware.
	var handler http.Handler = mux
	handler = middlewares.Logger(handler)

	return handler
}
