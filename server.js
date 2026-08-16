import express from "express";
import prisma from "./prismaClient.js";

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "BarberFlow API funcionando!",
  });
});

app.post("/clientes", async (req, res) => {
  try {
    console.log("BODY RECEBIDO:");
    console.log(req.body);

    const cliente = await prisma.cliente.create({
      data: {
        nome: req.body.nome,
        email: req.body.email,
        telefone: req.body.telefone,
        senha: req.body.senha,
      },
    });

    res.json(cliente);
  } catch (error) {
    res.status(500).json({
      erro: error.message,
    });
  }
});

app.get("/clientes", async (req, res) => {
  try {
    const clientes = await prisma.cliente.findMany();

    res.json(clientes);
  } catch (error) {
    res.status(500).json({
      erro: error.message,
    });
  }
});

app.listen(3000, () => {
  console.log("Servidor rodando em http://localhost:3000");
});
