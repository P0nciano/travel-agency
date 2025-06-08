import { PrismaClient } from '@prisma/client'
import { Router } from 'express'
import { z } from 'zod'

const prisma = new PrismaClient()
const router = Router()

const viagemSchema = z.object({
  descricao: z.string().min(3, { message: "Descrição deve ter no mínimo 3 caracteres" }),
  dataPartida: z.string().refine(date => !isNaN(Date.parse(date)), { message: "Data de partida inválida" }),
  valor: z.number().nonnegative({ message: "Valor não pode ser negativo" }),
  vagasDisponiveis: z.number().int().nonnegative({ message: "Vagas disponíveis não pode ser negativo" }),
})

// Listar viagens
router.get("/", async (req, res) => {
  try {
    const viagens = await prisma.viagem.findMany()
    res.status(200).json(viagens)
  } catch (error) {
    res.status(500).json({ erro: error })
  }
})

// Criar viagem
router.post("/", async (req, res) => {
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
    res.status(201).json(viagem)
  } catch (error) {
    res.status(400).json({ erro: error })
  }
})

router.put("/:id", async (req, res) => {
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
    res.status(200).json(viagem)
  } catch (error) {
    res.status(400).json({ erro: error })
  }
})

// Deletar viagem
router.delete("/:id", async (req, res) => {
  const { id } = req.params
  try {
    const viagem = await prisma.viagem.delete({ where: { id: Number(id) } })
    res.status(200).json(viagem)
  } catch (error) {
    res.status(400).json({ erro: error })
  }
})

export default router
