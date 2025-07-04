import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import nodemailer from 'nodemailer'
import { verificaToken } from '../middlewares/verificaToken'

const router = Router()
const prisma = new PrismaClient()

const usuarioSchema = z.object({
  nome: z.string().min(3),
  email: z.string().email(),
  senha: z.string()
    .min(8)
    .regex(/[A-Z]/, "Deve conter letra maiúscula")
    .regex(/[a-z]/, "Deve conter letra minúscula")
    .regex(/[0-9]/, "Deve conter número")
    .regex(/[\W_]/, "Deve conter símbolo"),
})

// ✅ Transporter com senha correta
const transporter = nodemailer.createTransport({
  host: "sandbox.smtp.mailtrap.io",
  port: 587,
  secure: false,
  auth: {
    user: "ee836398efe9c8",
    pass: "ab59548fe3f8eb" // senha correta usada também em reservas
  }
})

// ✅ POST /usuarios → cria usuário com validação e envio de e-mail de ativação
router.post("/", async (req, res) => {
  try {
    const dados = usuarioSchema.parse(req.body)
    const senhaCriptografada = await bcrypt.hash(dados.senha, 10)
    const codigoAtivacao = Math.random().toString(36).substring(2, 8).toUpperCase()

    const novoUsuario = await prisma.usuario.create({
      data: {
        nome: dados.nome,
        email: dados.email,
        senha: senhaCriptografada,
        codigoAtivacao,
        status: "INATIVO",
      },
    })

    const info = await transporter.sendMail({
      from: "Sistema de Reservas <no-reply@sistema.com>",
      to: dados.email,
      subject: "Ativação de Conta",
      html: `<p>Olá, ${dados.nome}!</p>
             <p>Clique para ativar sua conta: 
             <a href="http://localhost:3000/seguranca/ativar/${codigoAtivacao}">
             Ativar Conta</a></p>`
    })

    console.log("E-mail de ativação enviado:", info.messageId)

    res.status(201).json({ mensagem: "Usuário criado! Verifique o e-mail para ativação." })
  } catch (error) {
    console.error(error)
    res.status(500).json({ erro: error instanceof Error ? error.message : error })
  }
})

// ✅ GET /usuarios → lista usuários com token
router.get("/", verificaToken, async (req, res) => {
  try {
    const usuarios = await prisma.usuario.findMany({
      select: {
        id: true,
        nome: true,
        email: true,
        status: true,
        nivelAcesso: true
      }
    })
    res.json(usuarios)
  } catch (error) {
    res.status(500).json({ erro: "Erro ao buscar usuários." })
  }
})

export default router
