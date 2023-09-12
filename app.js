// index.js


//Required External Modules

const express = require("express")
const path = require("path")
const axios = require('axios')
const d3 = require("d3")

//App Variables

const app = express();
const port = process.env.PORT || "8000";
axios.defaults.baseURL = "http://localhost:5000";

//App Configuration



//Routes Definitions

app.get("/", (rew, res) => {
    res.status(200).send("Internet");
});

//Server Activation

app.listen(port, () => {
    console.log(`Listening to requests on http://localhost:${port}`);
  });