import { Router, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const rotas = Router()

rotas.post("/", async (req: Request, res: Response) => {
  const { email, senha } = req.body

  if (!email || !senha) {
    return res.status(400).json({ erro: "Email e senha são obrigatórios" })
  }

  try {
    const usuario = await prisma.usuario.findUnique({
      where: { email }
    })

    if (!usuario) {
      return res.status(404).json({ erro: "Usuário não encontrado" })
    }

    if (usuario.bloqueado) {
      return res.status(403).json({ erro: "Usuário bloqueado por tentativas inválidas" })
    }

    const senhaValida = await bcrypt.compare(senha, usuario.senha)
    if (!senhaValida) {
      const novasTentativas = usuario.tentativasLogin + 1
      const bloqueado = novasTentativas >= 3

      await prisma.usuario.update({
        where: { id: usuario.id },
        data: {
          tentativasLogin: novasTentativas,
          bloqueado
        }
      })

      return res.status(401).json({ erro: "Senha incorreta" })
    }

    // Resetar tentativas e atualizar último login
    await prisma.usuario.update({
      where: { id: usuario.id },
      data: {
        tentativasLogin: 0,
        bloqueado: false,
        ultimoLogin: new Date()
      }
    })

    const token = jwt.sign(
      {
        userLogadoId: usuario.id,
        userLogadoNome: usuario.nome
      },
      process.env.JWT_KEY as string,
      { expiresIn: "1h" }
    )

    await prisma.log.create({
      data: {
        acao: 'Login efetuado',
        usuarioId: usuario.id
      }
    })

    const mensagemLogin = usuario.ultimoLogin
      ? `Seu último acesso foi em ${new Date(usuario.ultimoLogin).toLocaleString()}`
      : "Este é seu primeiro acesso."

    res.status(200).json({ msg: "Login efetuado com sucesso", token, info: mensagemLogin })

  } catch (error) {
    res.status(500).json({ erro: "Erro ao realizar login" })
  }
})

export default rotas
