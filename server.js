import express from "express";
import prisma from "./prismaClient.js";
import cors from "cors";

const app = express();

app.use(express.json());
app.use(cors());

const HORARIO_ABERTURA = 10 * 60;
const HORARIO_FECHAMENTO = 20 * 60;
const INTERVALO_MINUTOS = 60;
const HORARIOS_INICIO = Array.from(
  { length: (HORARIO_FECHAMENTO - HORARIO_ABERTURA) / INTERVALO_MINUTOS },
  (_, index) => HORARIO_ABERTURA + index * INTERVALO_MINUTOS,
);

function parseDateOnly(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return date;
}

function minutesFromTime(value) {
  if (typeof value !== "string" || !/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) {
    return null;
  }
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

function timeFromMinutes(value) {
  const hours = Math.floor(value / 60).toString().padStart(2, "0");
  const minutes = (value % 60).toString().padStart(2, "0");
  return `${hours}:${minutes}`;
}

function isMonday(date) {
  return date.getUTCDay() === 1;
}

app.get("/", (req, res) => {
  res.json({ message: "BarberFlow API funcionando!" });
});

// Cadastro de clientes
app.post("/clientes", async (req, res) => {
  try {
    const { nome, email, telefone, senha } = req.body;

    if (!nome?.trim() || !email?.trim() || !telefone?.trim() || !senha) {
      return res.status(400).json({ erro: "Preencha todos os campos obrigatórios." });
    }

    const cliente = await prisma.cliente.create({
      data: {
        nome: nome.trim(),
        email: email.trim().toLowerCase(),
        telefone: telefone.trim(),
        senha,
      },
      select: {
        id: true,
        nome: true,
        email: true,
        telefone: true,
        createdAt: true,
      },
    });

    return res.status(201).json(cliente);
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(400).json({ erro: "Este e-mail já está cadastrado no BarberFlow." });
    }
    console.error("Erro ao cadastrar cliente:", error);
    return res.status(500).json({ erro: "Não foi possível cadastrar o cliente." });
  }
});

app.get("/clientes", async (req, res) => {
  try {
    const clientes = await prisma.cliente.findMany({
      select: { id: true, nome: true, email: true, telefone: true, createdAt: true },
    });
    return res.json(clientes);
  } catch (error) {
    console.error("Erro ao buscar clientes:", error);
    return res.status(500).json({ erro: "Não foi possível buscar os clientes." });
  }
});

// Login do cliente. A senha não é registrada nos logs.
app.post("/login", async (req, res) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const senha = req.body.senha;

    if (!email || !senha) {
      return res.status(400).json({ erro: "Informe e-mail e senha." });
    }

    const cliente = await prisma.cliente.findUnique({ where: { email } });

    if (!cliente || cliente.senha !== senha) {
      return res.status(401).json({ erro: "E-mail ou senha incorretos." });
    }

    return res.json({
      id: cliente.id,
      nome: cliente.nome,
      email: cliente.email,
      telefone: cliente.telefone,
    });
  } catch (error) {
    console.error("Erro no login:", error);
    return res.status(500).json({ erro: "Não foi possível realizar o login." });
  }
});

// Cadastro e consulta de serviços
app.post("/servicos", async (req, res) => {
  try {
    const { nome, descricao, preco, duracao } = req.body;
    if (!nome?.trim() || !Number.isFinite(Number(preco)) || Number(preco) < 0 || !Number.isInteger(Number(duracao)) || Number(duracao) <= 0) {
      return res.status(400).json({ erro: "Informe nome, preço e duração válidos." });
    }

    const servico = await prisma.servico.create({
      data: {
        nome: nome.trim(),
        descricao: descricao?.trim() || null,
        preco: Number(preco),
        duracao: Number(duracao),
      },
    });
    return res.status(201).json(servico);
  } catch (error) {
    console.error("Erro ao cadastrar serviço:", error);
    return res.status(500).json({ erro: "Não foi possível cadastrar o serviço." });
  }
});

app.get("/servicos", async (req, res) => {
  try {
    const servicos = await prisma.servico.findMany({ orderBy: { nome: "asc" } });
    return res.json(servicos);
  } catch (error) {
    console.error("Erro ao buscar serviços:", error);
    return res.status(500).json({ erro: "Não foi possível buscar os serviços." });
  }
});

/* =====================================
   CADASTRO E CONSULTA DE PROFISSIONAIS
===================================== */
app.post("/profissionais", async (req, res) => {
  try {
    const { nome, especialidade, descricao, foto } = req.body;
    if (!nome?.trim() || !especialidade?.trim()) {
      return res.status(400).json({ erro: "Nome e especialidade são obrigatórios." });
    }

    const profissional = await prisma.profissional.create({
      data: {
        nome: nome.trim(),
        especialidade: especialidade.trim(),
        descricao: descricao?.trim() || null,
        foto: foto?.trim() || null,
      },
    });
    return res.status(201).json(profissional);
  } catch (error) {
    console.error("Erro ao cadastrar profissional:", error);
    return res.status(500).json({ erro: "Não foi possível cadastrar o profissional." });
  }
});

app.get("/profissionais", async (req, res) => {
  try {
    const profissionais = await prisma.profissional.findMany({ orderBy: { nome: "asc" } });
    return res.json(profissionais);
  } catch (error) {
    console.error("Erro ao buscar profissionais:", error);
    return res.status(500).json({ erro: "Não foi possível buscar os profissionais." });
  }
});

app.get("/profissionais/disponiveis", async (req, res) => {
  try {
    const profissionais = await prisma.profissional.findMany({
      where: { ativo: true },
      orderBy: { nome: "asc" },
    });
    return res.json(profissionais);
  } catch (error) {
    console.error("Erro ao buscar profissionais disponíveis:", error);
    return res.status(500).json({ erro: "Não foi possível buscar os profissionais disponíveis." });
  }
});

/* =====================================
   AC3 — AGENDAMENTOS
===================================== */

// Consulta quais horários ainda podem ser agendados para um profissional/data/serviço.
app.get("/horarios", async (req, res) => {
  try {
    const profissionalId = Number(req.query.profissionalId);
    const servicoId = Number(req.query.servicoId);
    const data = parseDateOnly(req.query.data);

    if (!Number.isInteger(profissionalId) || profissionalId <= 0 || !data) {
      return res.status(400).json({ erro: "Informe profissionalId e data válidos (AAAA-MM-DD)." });
    }

    if (isMonday(data)) {
      return res.json({
        fechado: true,
        mensagem: "A barbearia não funciona às segundas-feiras.",
        horariosDisponiveis: [],
      });
    }

    const servico = Number.isInteger(servicoId) && servicoId > 0
      ? await prisma.servico.findUnique({ where: { id: servicoId }, select: { duracao: true } })
      : null;

    if (servicoId && !servico) {
      return res.status(404).json({ erro: "Serviço não encontrado." });
    }

    const duracaoSolicitada = servico?.duracao || 60;
    const agendamentos = await prisma.agendamento.findMany({
      where: { profissionalId, data, status: "CONFIRMADO" },
      include: { servico: { select: { duracao: true } } },
    });

    const horariosDisponiveis = HORARIOS_INICIO
      .filter((inicio) => {
        const fim = inicio + duracaoSolicitada;
        if (fim > HORARIO_FECHAMENTO) return false;

        return !agendamentos.some((agendamento) => {
          const inicioExistente = minutesFromTime(agendamento.hora);
          if (inicioExistente === null) return false;
          const fimExistente = inicioExistente + agendamento.servico.duracao;
          return inicio < fimExistente && inicioExistente < fim;
        });
      })
      .map(timeFromMinutes);

    return res.json({ fechado: false, horariosDisponiveis });
  } catch (error) {
    console.error("Erro ao consultar horários:", error);
    return res.status(500).json({ erro: "Não foi possível consultar os horários." });
  }
});

// Criar agendamento. Não há rotas de exclusão ou alteração nesta etapa.
app.post("/agendamentos", async (req, res) => {
  try {
    const clienteId = Number(req.body.clienteId);
    const servicoId = Number(req.body.servicoId);
    const profissionalId = Number(req.body.profissionalId);
    const data = parseDateOnly(req.body.data);
    const hora = req.body.hora;
    const inicioSolicitado = minutesFromTime(hora);

    if (
      !Number.isInteger(clienteId) || clienteId <= 0 ||
      !Number.isInteger(servicoId) || servicoId <= 0 ||
      !Number.isInteger(profissionalId) || profissionalId <= 0 ||
      !data || inicioSolicitado === null
    ) {
      return res.status(400).json({ erro: "Dados do agendamento inválidos." });
    }

    if (isMonday(data)) {
      return res.status(400).json({ erro: "A barbearia não funciona às segundas-feiras." });
    }

    if (!HORARIOS_INICIO.includes(inicioSolicitado)) {
      return res.status(400).json({ erro: "Horário fora do expediente. A barbearia funciona das 10h às 20h." });
    }

    const [cliente, servico, profissional] = await Promise.all([
      prisma.cliente.findUnique({ where: { id: clienteId }, select: { id: true, nome: true, email: true } }),
      prisma.servico.findUnique({ where: { id: servicoId } }),
      prisma.profissional.findFirst({ where: { id: profissionalId, ativo: true } }),
    ]);

    if (!cliente) return res.status(404).json({ erro: "Cliente não encontrado. Entre novamente na sua conta." });
    if (!servico) return res.status(404).json({ erro: "Serviço não encontrado." });
    if (!profissional) return res.status(404).json({ erro: "Profissional não encontrado ou indisponível." });

    if (inicioSolicitado + servico.duracao > HORARIO_FECHAMENTO) {
      return res.status(400).json({ erro: "Esse serviço ultrapassa o horário de fechamento da barbearia." });
    }

    const agendamentosDoDia = await prisma.agendamento.findMany({
      where: { profissionalId, data, status: "CONFIRMADO" },
      include: { servico: { select: { duracao: true } } },
    });

    const existeConflito = agendamentosDoDia.some((agendamento) => {
      const inicioExistente = minutesFromTime(agendamento.hora);
      if (inicioExistente === null) return false;
      const fimExistente = inicioExistente + agendamento.servico.duracao;
      const fimSolicitado = inicioSolicitado + servico.duracao;
      return inicioSolicitado < fimExistente && inicioExistente < fimSolicitado;
    });

    if (existeConflito) {
      return res.status(409).json({ erro: "Esse horário já está ocupado para o profissional selecionado. Escolha outro horário." });
    }

    const agendamento = await prisma.agendamento.create({
      data: { clienteId, servicoId, profissionalId, data, hora, status: "CONFIRMADO" },
      include: {
        servico: { select: { id: true, nome: true, preco: true, duracao: true } },
        profissional: { select: { id: true, nome: true, especialidade: true, foto: true } },
        cliente: { select: { id: true, nome: true, email: true } },
      },
    });

    return res.status(201).json(agendamento);
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(409).json({ erro: "Esse horário acabou de ser reservado. Escolha outro." });
    }
    if (error.code === "P2003") {
      return res.status(400).json({ erro: "Cliente, serviço ou profissional inválido." });
    }
    console.error("Erro ao criar agendamento:", error);
    return res.status(500).json({ erro: "Não foi possível confirmar o agendamento." });
  }
});

// Lista somente os agendamentos do cliente informado.
app.get("/agendamentos", async (req, res) => {
  try {
    const clienteId = Number(req.query.clienteId);
    if (!Number.isInteger(clienteId) || clienteId <= 0) {
      return res.status(400).json({ erro: "Informe um clienteId válido." });
    }

    const agendamentos = await prisma.agendamento.findMany({
      where: { clienteId },
      orderBy: [{ data: "asc" }, { hora: "asc" }],
      include: {
        servico: { select: { id: true, nome: true, preco: true, duracao: true } },
        profissional: { select: { id: true, nome: true, especialidade: true, foto: true } },
      },
    });

    return res.json(agendamentos);
  } catch (error) {
    console.error("Erro ao listar agendamentos:", error);
    return res.status(500).json({ erro: "Não foi possível listar os agendamentos." });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
