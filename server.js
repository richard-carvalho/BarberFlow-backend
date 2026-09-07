import express from "express";
import prisma from "./prismaClient.js";
import cors from "cors";

const app = express();

app.use(express.json());
app.use(cors());

app.get("/", (req, res) => {
  res.json({
    message: "BarberFlow API funcionando!",
  });
});
//insert de cliente
app.post("/clientes", async (req, res) => {
  try {
    const { nome, email, telefone, senha } = req.body;

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

// login do cliente
app.post("/login", async (req, res) => {
  try {
    const { email, senha } = req.body;

    console.log("LOGIN RECEBIDO:");
    console.log("Email:", email);
    console.log("Senha recebida:", senha);

    const cliente = await prisma.cliente.findUnique({
      where: {
        email: email,
      },
    });

    console.log("CLIENTE ENCONTRADO:", cliente);

    if (!cliente) {
      return res.status(401).json({
        erro: "E-mail ou senha incorretos.",
      });
    }

    console.log("Senha no banco:", cliente.senha);
    console.log("Senha confere:", cliente.senha === senha);

    if (cliente.senha !== senha) {
      return res.status(401).json({
        erro: "E-mail ou senha incorretos.",
      });
    }

    res.json({
      id: cliente.id,
      nome: cliente.nome,
      email: cliente.email,
      telefone: cliente.telefone,
    });
  } catch (error) {
    console.error("ERRO NO LOGIN:", error);

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
