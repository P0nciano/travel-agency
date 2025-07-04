import dotenv from "dotenv"
dotenv.config()

import express from 'express'

import backupRoutes from './routes/backup'
import routesClientes from './routes/clientes'
import routesReservas from './routes/reservas'
import routesViagens from './routes/viagens'
import routesSeguranca from './routes/seguranca'
import routesLogin from './routes/login'
import routesUsuario from './routes/usuario'
import routesLogs from './routes/logs'
const app = express()
const port = 3000

app.use(express.json())
app.use('/sistema', backupRoutes)
app.use("/clientes", routesClientes)
app.use("/reservas", routesReservas)
app.use("/viagens", routesViagens)
app.use("/seguranca", routesSeguranca)
app.use("/login", routesLogin)
app.use("/usuario", routesUsuario)
app .use("/logs", routesLogs)


app.get('/', (req, res) => {
  res.send('API: Controle de Vendas da Cantina')
})

app.listen(port, () => {
  console.log(`Servidor rodando na porta: ${port}`)
})