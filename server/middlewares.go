package server

import (
	"log"
	"net/http"
)

type loggerRecorder struct {
	http.ResponseWriter
	status int
}

func (w *loggerRecorder) WriteHeader(code int) {
	w.status = code
	w.ResponseWriter.WriteHeader(code)
}

func loggerMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		recorder := loggerRecorder{w, -1}
		next.ServeHTTP(&recorder, r)
		log.Printf(
			"%s \"%s %s %s\" %d \"%s\"\n",
			r.RemoteAddr,
			r.Method,
			r.URL.Path,
			r.Proto,
			recorder.status,
			r.UserAgent(),
		)
	})
}
