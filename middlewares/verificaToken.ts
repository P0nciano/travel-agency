import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

interface TokenInterface {
  userLogadoId: number
  userLogadoNome: string
}

declare global {
  namespace Express {
    interface Request {
      usuario?: {
        id: number
        nome: string
      }
    }
  }
}

export function verificaToken(req: Request, res: Response, next: NextFunction) {
  const { authorization } = req.headers

  if (!authorization) {
    return res.status(401).json({ erro: "Token não informado" })
  }

  const token = authorization.split(" ")[1]

  try {
    const decode = jwt.verify(token, process.env.JWT_KEY as string) as TokenInterface

    req.usuario = {
      id: decode.userLogadoId,
      nome: decode.userLogadoNome
    }

    next()
  } catch (erro) {
    return res.status(401).json({ erro: "Token inválido" })
  }
}
