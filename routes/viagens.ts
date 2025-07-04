import { PrismaClient } from '@prisma/client'
import { Router } from 'express'
import { z } from 'zod'
import { verificaToken } from '../middlewares/verificaToken'

const prisma = new PrismaClient()
const router = Router()

const viagemSchema = z.object({
  descricao: z.string().min(3, { message: "Descrição deve ter no mínimo 3 caracteres" }),
  dataPartida: z.string().refine(date => !isNaN(Date.parse(date)), { message: "Data de partida inválida" }),
  valor: z.number().nonnegative({ message: "Valor não pode ser negativo" }),
  vagasDisponiveis: z.number().int().nonnegative({ message: "Vagas disponíveis não pode ser negativo" }),
})

// GET - sem token
router.get("/", async (req, res) => {
  try {
    const viagens = await prisma.viagem.findMany()
    res.status(200).json(viagens)
  } catch (error) {
    res.status(500).json({ erro: error })
  }
})

// POST - com token e log
router.post("/", verificaToken, async (req: any, res) => {
  const valida = viagemSchema.safeParse(req.body)
  if (!valida.success) {
    return res.status(400).json({ erro: valida.error })
  }

  try {
    const viagem = await prisma.viagem.create({
      data: {
        descricao: valida.data.descricao,
        dataPartida: new Date(valida.data.dataPartida),
        valor: valida.data.valor,
        vagasDisponiveis: valida.data.vagasDisponiveis,
      }
    })

    await prisma.log.create({
      data: {
        acao: `Criação de viagem: ${viagem.descricao}`,
        usuarioId: req.usuario.id
      }
    })

    res.status(201).json(viagem)
  } catch (error) {
    res.status(400).json({ erro: error })
  }
})

// PUT - com token e log
router.put("/:id", verificaToken, async (req: any, res) => {
  const { id } = req.params
  const valida = viagemSchema.safeParse(req.body)
  if (!valida.success) {
    return res.status(400).json({ erro: valida.error })
  }

  try {
    const viagem = await prisma.viagem.update({
      where: { id: Number(id) },
      data: {
        descricao: valida.data.descricao,
        dataPartida: new Date(valida.data.dataPartida),
        valor: valida.data.valor,
        vagasDisponiveis: valida.data.vagasDisponiveis,
      }
    })

    await prisma.log.create({
      data: {
        acao: `Edição de viagem: ID ${id}`,
        usuarioId: req.usuario.id
      }
    })

    res.status(200).json(viagem)
  } catch (error) {
    res.status(400).json({ erro: error })
  }
})

// DELETE - com token e log
router.delete("/:id", verificaToken, async (req: any, res) => {
  const { id } = req.params
  try {
    const viagem = await prisma.viagem.delete({ where: { id: Number(id) } })

    await prisma.log.create({
      data: {
        acao: `Exclusão de viagem: ID ${id}`,
        usuarioId: req.usuario.id
      }
    })

    res.status(200).json(viagem)
  } catch (error) {
    res.status(400).json({ erro: error })
  }
})

export default router
