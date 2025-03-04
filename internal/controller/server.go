package controller

import (
	"errors"
	"io/fs"
	"net/http"

	"github.com/nicholasngai/react-template/internal/middlewares"
)

type defaultIndexHTMLFileSystem struct {
	fs http.FileSystem
}

func (fsys defaultIndexHTMLFileSystem) Open(name string) (http.File, error) {
	// Open file. Return it if it worked.
	f, err := fsys.fs.Open(name)
	if err == nil {
		return f, nil
	}

	// If not a not-exists error, return the error.
	if !errors.Is(err, fs.ErrNotExist) {
		return nil, err
	}

	// Try to open /index.html instead.
	return fsys.fs.Open("index.html")
}

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
