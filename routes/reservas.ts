import { PrismaClient } from '@prisma/client'
import { Router } from 'express'
import { z } from 'zod'
import nodemailer from 'nodemailer'
import { verificaToken } from '../middlewares/verificaToken'

const prisma = new PrismaClient()
const router = Router()

const reservaSchema = z.object({
  clienteId: z.number().int().positive(),
  viagemId: z.number().int().positive(),
  quantidadePessoas: z.number().int().positive({ message: "Quantidade de pessoas deve ser maior que zero" }),
  status: z.string().min(1, { message: "Status é obrigatório" }),
})

// GET - listar todas as reservas (sem token)
router.get("/", async (req, res) => {
  try {
    const reservas = await prisma.reserva.findMany({
      include: { cliente: true, viagem: true }
    })
    res.status(200).json(reservas)
  } catch (error) {
    res.status(500).json({ erro: error instanceof Error ? error.message : error })
  }
})

// POST - criar reserva com envio de email e log
router.post("/", verificaToken, async (req: any, res) => {
  const valida = reservaSchema.safeParse(req.body)
  if (!valida.success) return res.status(400).json({ erro: valida.error })

  const { clienteId, viagemId, quantidadePessoas, status } = valida.data

  const cliente = await prisma.cliente.findUnique({ where: { id: clienteId } })
  if (!cliente) return res.status(400).json({ erro: "Código do cliente inválido" })

  const viagem = await prisma.viagem.findUnique({ where: { id: viagemId } })
  if (!viagem) return res.status(400).json({ erro: "Código da viagem inválido" })

  if (viagem.vagasDisponiveis < quantidadePessoas) {
    return res.status(400).json({ erro: "Não há vagas suficientes para essa viagem" })
  }

  const valorTotal = Number(viagem.valor) * quantidadePessoas

  try {
    const [reserva, viagemAtualizada] = await prisma.$transaction([
      prisma.reserva.create({
        data: { clienteId, viagemId, quantidadePessoas, valorTotal, status }
      }),
      prisma.viagem.update({
        where: { id: viagemId },
        data: { vagasDisponiveis: { decrement: quantidadePessoas } }
      }),
    ])

    await prisma.log.create({
      data: {
        acao: `Reserva criada (ID: ${reserva.id})`,
        usuarioId: req.usuario.id
      }
    })

    const clienteComReservas = await prisma.cliente.findFirst({
      where: { id: clienteId },
      include: {
        reservas: {
          include: {
            viagem: true
          }
        }
      }
    })

    if (clienteComReservas) {
      await enviaEmail(clienteComReservas)
    }

    res.status(201).json({ reserva, viagem: viagemAtualizada })
  } catch (error) {
    res.status(400).json({ erro: error instanceof Error ? error.message : error })
  }
})

// PUT - atualizar reserva + log
router.put("/:id", verificaToken, async (req: any, res) => {
  const { id } = req.params
  const valida = reservaSchema.safeParse(req.body)
  if (!valida.success) return res.status(400).json({ erro: valida.error })

  const { clienteId, viagemId, quantidadePessoas, status } = valida.data

  const cliente = await prisma.cliente.findUnique({ where: { id: clienteId } })
  if (!cliente) return res.status(400).json({ erro: "Código do cliente inválido" })

  const viagem = await prisma.viagem.findUnique({ where: { id: viagemId } })
  if (!viagem) return res.status(400).json({ erro: "Código da viagem inválido" })

  const reservaAntiga = await prisma.reserva.findUnique({ where: { id: Number(id) } })
  if (!reservaAntiga) return res.status(400).json({ erro: "Reserva não encontrada" })

  const vagasDisponiveisReais = viagem.vagasDisponiveis + reservaAntiga.quantidadePessoas
  if (vagasDisponiveisReais < quantidadePessoas) {
    return res.status(400).json({ erro: "Não há vagas suficientes para essa alteração" })
  }

  const valorTotal = Number(viagem.valor) * quantidadePessoas

  try {
    const [reservaAtualizada, viagemAtualizada] = await prisma.$transaction([
      prisma.reserva.update({
        where: { id: Number(id) },
        data: { clienteId, viagemId, quantidadePessoas, valorTotal, status }
      }),
      prisma.viagem.update({
        where: { id: viagemId },
        data: {
          vagasDisponiveis: {
            decrement: quantidadePessoas - reservaAntiga.quantidadePessoas
          }
        }
      })
    ])

    await prisma.log.create({
      data: {
        acao: `Reserva editada (ID: ${id})`,
        usuarioId: req.usuario.id
      }
    })

    res.status(200).json({ reserva: reservaAtualizada, viagem: viagemAtualizada })
  } catch (error) {
    res.status(400).json({ erro: error instanceof Error ? error.message : error })
  }
})

// DELETE - remover reserva + log
router.delete("/:id", verificaToken, async (req: any, res) => {
  const { id } = req.params

  try {
    const reservaExcluida = await prisma.reserva.findUnique({ where: { id: Number(id) } })
    if (!reservaExcluida) return res.status(400).json({ erro: "Reserva não encontrada" })

    const [reserva, viagem] = await prisma.$transaction([
      prisma.reserva.delete({ where: { id: Number(id) } }),
      prisma.viagem.update({
        where: { id: reservaExcluida.viagemId },
        data: { vagasDisponiveis: { increment: reservaExcluida.quantidadePessoas } }
      })
    ])

    await prisma.log.create({
      data: {
        acao: `Reserva excluída (ID: ${id})`,
        usuarioId: req.usuario.id
      }
    })

    res.status(200).json({ reserva, viagem })
  } catch (error) {
    res.status(400).json({ erro: error instanceof Error ? error.message : error })
  }
})

// Função para montar e-mail
function gerarTabelaHTML(dados: any, mostrarPessoas = true) {
  let html = `
    <html>
    <body style="font-family: Helvetica, Arial, sans-serif;">
      <h2>Agência de Viagens - Relatório de Reservas</h2>
      <h3>Cliente: ${dados.nome} - E-mail: ${dados.email}</h3>
  `

  for (const reserva of dados.reservas) {
    const dataReserva = new Date(reserva.dataReserva).toLocaleString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })

    const dataViagem = new Date(reserva.viagem.dataPartida).toLocaleDateString('pt-BR')
    const valorUnitario = reserva.viagem.valor.toNumber()
    const qtdPessoas = mostrarPessoas ? reserva.quantidadePessoas : 1
    const totalReserva = valorUnitario * qtdPessoas

    html += `
      <table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse; margin-bottom: 20px;">
        <tr style="background-color: rgb(195, 191, 191);"><th colspan="2">Reserva</th></tr>
        <tr><td><strong>Data da Reserva:</strong></td><td>${dataReserva}</td></tr>
        <tr><td><strong>Destino:</strong></td><td>${reserva.viagem.descricao}</td></tr>
        <tr><td><strong>Data da Viagem:</strong></td><td>${dataViagem}</td></tr>
        <tr><td><strong>Preço Unitário (R$):</strong></td><td>${valorUnitario.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td></tr>
        ${mostrarPessoas ? `<tr><td><strong>Qtd. Pessoas:</strong></td><td>${qtdPessoas}</td></tr>` : ""}
        <tr><td><strong>Total Reserva (R$):</strong></td><td>${totalReserva.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td></tr>
      </table>
    `
  }

  html += `</body></html>`
  return html
}

// Transporter configurado (exemplo com Mailtrap)
const transporter = nodemailer.createTransport({
  host: "sandbox.smtp.mailtrap.io",
  port: 587,
  secure: false,
  auth: {
    user: "ee836398efe9c8",
    pass: "ab59548fe3f8eb",
  },
})

async function enviaEmail(dados: any) {
  const mensagem = gerarTabelaHTML(dados, true)

  const info = await transporter.sendMail({
    from: 'Agência de Viagens <contato@agencia.com>',
    to: dados.email,
    subject: "Relatório de Reservas",
    text: "Relatório de Reservas...",
    html: mensagem
  })

  console.log("E-mail enviado:", info.messageId)
}

// GET - Enviar e-mail de relatório
router.get("/email/:id", async (req, res) => {
  const { id } = req.params

  try {
    const cliente = await prisma.cliente.findFirst({
      where: { id: Number(id) },
      include: {
        reservas: {
          include: {
            viagem: true
          }
        }
      }
    })

    if (!cliente) {
      return res.status(404).json({ erro: "Cliente não encontrado" })
    }

    await enviaEmail(cliente)

    res.status(200).json({ mensagem: "E-mail enviado com sucesso" })
  } catch (error) {
    res.status(500).json({ erro: error instanceof Error ? error.message : error })
  }
})

export default router
