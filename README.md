# 🌍 Travel Agency API

A RESTful API developed to manage a Travel Agency system, providing complete control over **clients**, **trips**, and **reservations**. This project was created as part of an academic assignment in a Software Development course.

---

## 🚀 Features

- ✅ Register and manage clients
- ✅ Register and manage trips
- ✅ Register reservations linking clients to trips
- ✅ List all clients, trips, and reservations
- ✅ Update and delete records
- ✅ Autenticação de usuários com criptografia de senha e JWT
- ✅ Envio de e-mail de confirmação e relatório de reservas
- ✅ Sistema de logs para registrar ações dos usuários
- ✅ Backup e restauração completa dos dados via JSON
- ✅ Relational database managed with Prisma ORM
- ✅ MySQL as the database engine

---

## 🛠 Technologies Used

- [Node.js](https://nodejs.org/)
- [TypeScript](https://www.typescriptlang.org/)
- [Prisma ORM](https://www.prisma.io/)
- [MySQL](https://www.mysql.com/)
- [Express.js](https://expressjs.com/)
- [Postman](https://www.postman.com/) (for testing)

---

## 📁 Project Structure

```
src/
├── controllers/
├── prisma/          # Prisma schema and migrations
├── routes/
└── server.ts        # Entry point of the application
```

---

## 🔧 How to Run the Project

### 1. Clone the repository

```bash
git clone https://github.com/your-username/travel-agency.git
cd travel-agency
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure the environment variables

Create a `.env` file in the root directory with the following content:

```env
DATABASE_URL="mysql://user:password@localhost:3306/database_name"
JWT_KEY="sua_chave_jwt"
MAILTRAP_USER="ee836398efe9c8"
MAILTRAP_PASS="ab59548fe3f8eb"
```

### 4. Run database migrations

```bash
npx prisma migrate dev --name init
```

### 5. Start the development server

```bash
npm run dev
```

> ⚠️ **Importante:** O sistema envia e-mails usando o Mailtrap (modo sandbox). Verifique a caixa de entrada no Mailtrap para os testes de ativação de conta e reservas.

---

## 📬 Sample API Routes

| Method | Endpoint                         | Description                                        |
|--------|----------------------------------|----------------------------------------------------|
| POST   | `/usuarios`                      | Cria novo usuário com validação e e-mail de ativação |
| POST   | `/login`                         | Realiza login e gera token JWT                     |
| GET    | `/usuarios`                      | Lista usuários (requer token)                      |
| GET    | `/clients`                       | List all clients                                   |
| POST   | `/trips`                         | Register a new trip                                |
| POST   | `/reservations`                  | Create a new reservation                           |
| PUT    | `/clients/:id`                   | Update a client                                    |
| DELETE | `/trips/:id`                     | Delete a trip                                      |
| GET    | `/seguranca/ativar/:codigo`      | Ativa conta por código enviado por e-mail          |
| GET    | `/seguranca/backup`              | Gera backup JSON com os dados do sistema           |
| POST   | `/seguranca/restore`             | Restaura o sistema com base no backup JSON         |

---

## 👨‍🎓 About the Project

This project was developed by **Felipe Ponciano de Almeida**, a 3rd-semester Software Development student, as part of a practical academic assignment. The goal was to apply knowledge of TypeScript, Express, Prisma, and MySQL to build a complete CRUD API for managing a travel agency.

---

## 📄 License

This project is for academic purposes and does not have a commercial license.