package main

import (
	"flag"
	"log"
	"net/http"
	"strconv"

	"github.com/nicholasngai/react-template/internal/controller"
)

func main() {
	var bind string
	var port int64
	flag.StringVar(&bind, "bind", "127.0.0.1", "Address bind the server to")
	flag.Int64Var(&port, "port", 8080, "Port for the server to listen on")

	flag.Parse()

	mux := controller.GetHandler()
	err := http.ListenAndServe(bind+":"+strconv.FormatInt(port, 10), mux)
	if err != nil {
		log.Fatal("Error starting server: "+err.Error())
	}
}
