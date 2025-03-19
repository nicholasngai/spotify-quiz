package controller

import (
	"fmt"
	"net/http"
)

func (c Controller) HelloWorldHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Add("Content-Type", "application/json")
	fmt.Fprint(w, `{"data":"Hello world!"}`)
}
