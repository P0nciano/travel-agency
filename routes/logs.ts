import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { verificaToken } from '../middlewares/verificaToken'

const router = Router()
const prisma = new PrismaClient()

// GET /logs (protegido por token)
router.get("/", verificaToken, async (req, res) => {
  try {
    const logs = await prisma.log.findMany({
      include: {
        usuario: {
          select: { nome: true }
        }
      },
      orderBy: {
      dataHora: 'desc'
      }
    })

    res.status(200).json(logs)
  } catch (error) {
    res.status(500).json({ erro: "Erro ao buscar logs" })
  }
})

export default router
