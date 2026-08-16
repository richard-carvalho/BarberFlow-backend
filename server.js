import express from "express";
import prisma from "./prismaClient.js";

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "BarberFlow API funcionando!",
  });
});
//insert de cliente
app.post("/clientes", async (req, res) => {
  try {
    const cliente = await prisma.cliente.create({
      data: {
        nome: req.body.nome,
        email: req.body.email,
        telefone: req.body.telefone,
        senha: req.body.senha,
      },
      select: {
        id: true,
        nome: true,
        email: true,
        telefone: true,
        createdAt: true,
      },
    });

    res.json(cliente);
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(400).json({
        erro: "Este e-mail já está cadastrado no BarberFlow",
      });
    }

    res.status(500).json({
      erro: error.message,
    });
  }
});

//buscar cliente
app.get("/clientes", async (req, res) => {
  try {
    const clientes = await prisma.cliente.findMany({
      select: {
        id: true,
        nome: true,
        email: true,
        telefone: true,
        createdAt: true,
      },
    });

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
