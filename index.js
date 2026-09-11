const express = require("express");
const app = express();
const puerto = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("API funcionando correctamente");
});

app.listen(puerto, () => {
  console.log(`Servidor activo en http://localhost:${puerto}`);
});
