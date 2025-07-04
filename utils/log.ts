import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function registrarLog(acao: string, usuarioId: number) {
  await prisma.log.create({
    data: {
      acao,
      usuarioId
    }
  })
}
