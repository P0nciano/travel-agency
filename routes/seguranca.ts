import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import fs from 'fs'

const router = Router()
const prisma = new PrismaClient()

// ✅ Ativação de conta via código de e-mail
router.get("/ativar/:codigo", async (req, res) => {
  const { codigo } = req.params

  try {
    const usuario = await prisma.usuario.findFirst({
      where: { codigoAtivacao: codigo }
    })

    if (!usuario)
      return res.status(404).json({ erro: "Código inválido." })

    await prisma.usuario.update({
      where: { id: usuario.id },
      data: { status: "ATIVO" }
    })

    await prisma.log.create({
      data: {
        acao: "Conta ativada",
        usuarioId: usuario.id
      }
    })

    res.status(200).json({ mensagem: "Conta ativada com sucesso!" })
  } catch (error) {
    res.status(500).json({ erro: "Erro ao ativar conta." })
  }
})

// ✅ GET /seguranca/backup → exporta os dados para JSON
router.get("/backup", async (req, res) => {
  try {
    const usuarios = await prisma.usuario.findMany()
    const clientes = await prisma.cliente.findMany()
    const viagens = await prisma.viagem.findMany()
    const reservas = await prisma.reserva.findMany()
    const logs = await prisma.log.findMany()

    const dados = { usuarios, clientes, viagens, reservas, logs }

    fs.writeFileSync("backup.json", JSON.stringify(dados, null, 2))
    res.download("backup.json")
  } catch (error) {
    res.status(500).json({ erro: "Erro ao gerar backup." })
  }
})

// ✅ POST /seguranca/restore → restaura os dados a partir do backup
router.post("/restore", async (req, res) => {
  try {
    const conteudo = fs.readFileSync("backup.json", "utf-8")
    const dados = JSON.parse(conteudo)

    await prisma.log.deleteMany()
    await prisma.reserva.deleteMany()
    await prisma.viagem.deleteMany()
    await prisma.cliente.deleteMany()
    await prisma.usuario.deleteMany()

    await prisma.usuario.createMany({ data: dados.usuarios })
    await prisma.cliente.createMany({ data: dados.clientes })
    await prisma.viagem.createMany({ data: dados.viagens })
    await prisma.reserva.createMany({ data: dados.reservas })
    await prisma.log.createMany({ data: dados.logs })

    res.json({ mensagem: "Restauração concluída com sucesso." })
  } catch (error) {
    res.status(500).json({ erro: "Erro ao restaurar backup." })
  }
})

export default router
