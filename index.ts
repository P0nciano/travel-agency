import express from 'express'
import routesClientes from './routes/clientes'
import routesReservas from './routes/reservas'
import routesViagens from './routes/viagens'


const app = express()
const port = 3000

app.use(express.json())

app.use("/clientes", routesClientes)
app.use("/reservas", routesReservas)
app.use("/viagens", routesViagens)


app.get('/', (req, res) => {
  res.send('API: Controle de Vendas da Cantina')
})

app.listen(port, () => {
  console.log(`Servidor rodando na porta: ${port}`)
})