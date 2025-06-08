import { PrismaClient } from '@prisma/client'
import { Router } from 'express'
import { z } from 'zod'


const prisma = new PrismaClient()
const router = Router()

const clienteSchema = z.object({
  nome: z.string().min(10, { message: "Nome deve ter no mínimo 10 caracteres" }),
  email: z.string().email().min(10, { message: "E-mail inválido ou muito curto" }),
  telefone: z.string().min(8, { message: "Telefone deve ter no mínimo 8 caracteres" }),
})

router.get("/", async (req, res) => {
  try {
    const clientes = await prisma.cliente.findMany()
    res.status(200).json(clientes)
  } catch (error) {
    res.status(500).json({ erro: error })
  }
})

router.post("/", async (req, res) => {
  const valida = clienteSchema.safeParse(req.body)
  if (!valida.success) {
    return res.status(400).json({ erro: valida.error })
  }

  const { nome, email, telefone } = valida.data

  try {
    const cliente = await prisma.cliente.create({
      data: { nome, email, telefone }
    })
    res.status(201).json(cliente)
  } catch (error) {
    res.status(400).json({ erro: error })
  }
})

router.put("/:id", async (req, res) => {
  const { id } = req.params

  const valida = clienteSchema.safeParse(req.body)
  if (!valida.success) {
    return res.status(400).json({ erro: valida.error })
  }

  const { nome, email, telefone } = valida.data

  try {
    const cliente = await prisma.cliente.update({
      where: { id: Number(id) },
      data: { nome, email, telefone }
    })
    res.status(200).json(cliente)
  } catch (error) {
    res.status(400).json({ erro: error })
  }
})

router.delete("/:id", async (req, res) => {
  const { id } = req.params

  try {
    const cliente = await prisma.cliente.delete({
      where: { id: Number(id) }
    })
    res.status(200).json(cliente)
  } catch (error) {
    res.status(400).json({ erro: error })
  }
})



export default router
