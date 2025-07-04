import { PrismaClient } from '@prisma/client'
import { Router } from 'express'
import { z } from 'zod'
import { verificaToken } from '../middlewares/verificaToken'

const prisma = new PrismaClient()
const router = Router()

const clienteSchema = z.object({
  nome: z.string().min(10, { message: "Nome deve ter no mínimo 10 caracteres" }),
  email: z.string().email().min(10, { message: "E-mail inválido ou muito curto" }),
  telefone: z.string().min(8, { message: "Telefone deve ter no mínimo 8 caracteres" }),
})

// GET - sem token
router.get("/", async (req, res) => {
  try {
    const clientes = await prisma.cliente.findMany()
    res.status(200).json(clientes)
  } catch (error) {
    res.status(500).json({
      erro: error instanceof Error ? error.message : "Erro ao buscar clientes"
    })
  }
})

// POST - protegido
router.post("/", verificaToken, async (req: any, res) => {
  const valida = clienteSchema.safeParse(req.body)
  if (!valida.success) {
    return res.status(400).json({ erro: valida.error.format() })
  }

  const { nome, email, telefone } = valida.data

  try {
    const cliente = await prisma.cliente.create({
      data: { nome, email, telefone }
    })

    await prisma.log.create({
      data: {
        acao: `Criação de cliente: ${cliente.nome}`,
        usuarioId: req.usuario.id
      }
    })

    res.status(201).json(cliente)
  } catch (error) {
    res.status(400).json({
      erro: error instanceof Error ? error.message : "Erro ao criar cliente"
    })
  }
})

// PUT - protegido
router.put("/:id", verificaToken, async (req: any, res) => {
  const { id } = req.params

  const valida = clienteSchema.safeParse(req.body)
  if (!valida.success) {
    return res.status(400).json({ erro: valida.error.format() })
  }

  const { nome, email, telefone } = valida.data

  try {
    const cliente = await prisma.cliente.update({
      where: { id: Number(id) },
      data: { nome, email, telefone }
    })

    await prisma.log.create({
      data: {
        acao: `Edição de cliente: ID ${id}`,
        usuarioId: req.usuario.id
      }
    })

    res.status(200).json(cliente)
  } catch (error) {
    res.status(400).json({
      erro: error instanceof Error ? error.message : "Erro ao editar cliente"
    })
  }
})

// DELETE - protegido
router.delete("/:id", verificaToken, async (req: any, res) => {
  const { id } = req.params

  try {
    const cliente = await prisma.cliente.delete({
      where: { id: Number(id) }
    })

    await prisma.log.create({
      data: {
        acao: `Exclusão de cliente: ID ${id}`,
        usuarioId: req.usuario.id
      }
    })

    res.status(200).json(cliente)
  } catch (error) {
    res.status(400).json({
      erro: error instanceof Error ? error.message : "Erro ao excluir cliente"
    })
  }
})

export default router
