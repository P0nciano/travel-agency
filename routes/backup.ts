
import { Router, Response } from 'express'
import { exec } from 'child_process'
import path from 'path'
import fs from 'fs'

const router = Router()

const BACKUP_PATH = path.resolve(__dirname, '../backup')
const DUMP_FILE = path.resolve(BACKUP_PATH, 'backup.sql')

// Rota para realizar o backup
router.get('/backup', async (_, res: Response) => {
  try {
    if (!fs.existsSync(BACKUP_PATH)) fs.mkdirSync(BACKUP_PATH)

    const cmd = `mysqldump -u root -p1234 seguranca_251_noite > "${DUMP_FILE}"`
    exec(cmd, (error) => {
      if (error) return res.status(500).json({ erro: 'Erro ao realizar o backup' })
      res.download(DUMP_FILE)
    })
  } catch {
    res.status(500).json({ erro: 'Erro inesperado no backup' })
  }
})

// Rota para realizar o restore
router.post('/restore', async (_, res: Response) => {
  try {
    const cmd = `mysql -u root -p1234 seguranca_251_noite < "${DUMP_FILE}"`
    exec(cmd, (error) => {
      if (error) return res.status(500).json({ erro: 'Erro ao restaurar o banco' })
      res.status(200).json({ msg: 'Restore concluído com sucesso!' })
    })
  } catch {
    res.status(500).json({ erro: 'Erro inesperado no restore' })
  }
})

export default router
