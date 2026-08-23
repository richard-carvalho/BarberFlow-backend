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
    // 1) Recebe os dados
    const { nome, email, telefone, senha, confirmar_senha } = req.body;

    // 2) Confere se as senhas são iguais
    if (senha !== confirmar_senha) {
      return res.status(400).json({
        erro: "As senhas não conferem",
      });
    }

    // 3) Só depois grava no banco
    const cliente = await prisma.cliente.create({
      data: {
        nome: nome,
        email: email,
        telefone: telefone,
        senha: senha,
      },
      select: {
        id: true,
        nome: true,
        email: true,
        telefone: true,
        createdAt: true,
      },
    });

    // 4) Retorna o cliente criado
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

// criar serviços
app.post("/servicos", async (req, res) => {
  try {
    const servico = await prisma.servico.create({
      data: {
        nome: req.body.nome,
        descricao: req.body.descricao,
        preco: req.body.preco,
        duracao: req.body.duracao,
      },
    });

    res.json(servico);
  } catch (error) {
    res.status(500).json({
      erro: error.message,
    });
  }
});

//consulta de serviços
app.get("/servicos", async (req, res) => {
  try {
    const servicos = await prisma.servico.findMany();

    res.json(servicos);
  } catch (error) {
    res.status(500).json({
      erro: error.message,
    });
  }
});

app.listen(3000, () => {
  console.log("Servidor rodando em http://localhost:3000");
});
