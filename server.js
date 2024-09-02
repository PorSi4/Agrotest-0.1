import express from 'express';
import bodyParser from 'body-parser';
import { PrismaClient } from '@prisma/client';
import session from 'express-session';
import bcrypt from 'bcrypt';
import { MercadoPagoConfig, Payment } from 'mercadopago';

// Configuração do Prisma Client
const prisma = new PrismaClient();

// Configuração do Mercado Pago
const client = new MercadoPagoConfig({ accessToken: process.env.acess_token });
const payment = new Payment(client);

const app = express();
app.use(bodyParser.json());
app.use(express.static('public'));


app.use(session({
    secret: process.env.secret_key,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } //`true` se estiver usando HTTPS
}));

app.post('/register', async (req, res) => {
    const { email, password, name } = req.body;

    try {
        // Verificar se o usuário já existe
        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            return res.status(400).json({ error: 'E-mail já registrado' });
        }

        // Hash da senha
        const hashedPassword = await bcrypt.hash(password, 10);

        // Criar o novo usuário
        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name
            }
        });

        res.status(201).json({ message: 'Usuário registrado com sucesso', user });
    } catch (error) {
        console.error('Erro ao registrar usuário:', error);
        res.status(500).json({ error: 'Erro ao registrar usuário' });
    }
});

// Rota de Login
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        // Verificar se o usuário existe
        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user) {
            return res.status(400).json({ error: 'Usuário não encontrado' });
        }

        // Verificar a senha
        const isValid = await bcrypt.compare(password, user.password);

        if (!isValid) {
            return res.status(400).json({ error: 'Senha incorreta' });
        }

        // Armazenar informações do usuário na sessão
        req.session.userId = user.id;
        req.session.userEmail = user.email; // Armazenando o e-mail na sessão

        res.status(200).json({ message: 'Login realizado com sucesso', user });
    } catch (error) {
        console.error('Erro ao realizar login:', error);
        res.status(500).json({ error: 'Erro ao realizar login' });
    }
});

// Função para calcular o valor total do carrinho
const calculateCartTotal = (items) => {
    return items.reduce((total, item) => total + (parseFloat(item.price) * parseInt(item.quantity, 10)), 0);
};

app.post('/create-order', async (req, res) => {
    const { name, address, houseNumber, cep, items } = req.body;
    const userId = req.session.userId; // Captura o ID do usuário logado

    //console.log('Dados recebidos:', req.body); // Log pra ver os dados

    if (!items || !Array.isArray(items)) {
        return res.status(400).json({ error: 'Items must be an array' });
    }

    const total = calculateCartTotal(items);

    try {
        // Criação do pedido
        const order = await prisma.order.create({
            data: {
                userId,
                name,
                total,
                address,
                houseNumber,
                cep,
                orderItems: {
                    create: items.map(item => ({
                        name: item.name,    
                        price: item.price,  
                        img: item.img,  
                        quantity: item.quantity
                    }))
                }
            },
            include: {
                orderItems: true
            }
        });

        // PADRAO MERCADO PAGO
        const body = {
            transaction_amount: total,
            description: 'Produtos agrícolas',
            payment_method_id: 'pix',
            payer: {
                email: req.session.userEmail
            },
        };

        try {
            const paymentResponse = await payment.create({ body });

            const ticketUrl = paymentResponse?.point_of_interaction?.transaction_data?.ticket_url;

            if (ticketUrl) {
                res.json({ 
                    order,
                    ticket_url: ticketUrl // Envia o link de pagamento junto com os detalhes do pedido
                });
            } else {
                console.error('Erro: Ticket URL não encontrado na resposta.');
                res.status(500).json({ error: 'Não foi possível obter o link de pagamento' });
            }
        } catch (error) {
            console.error('Erro ao criar a preferência de pagamento:', error);
            res.status(500).json({ error: 'Erro ao criar a preferência de pagamento' });
        }
    } catch (error) {
        console.error('Erro ao criar o pedido:', error);
        res.status(500).json({ error: 'Erro ao criar o pedido' });
    }
});


app.post('/create-preference', async (req, res) => {
    const items = req.body.items;

    if (!items || !Array.isArray(items)) {
        //console.log('Dados recebidos:', req.body);
        return res.status(400).json({ error: 'Formato de itens inválido' });
    }

    const totalAmount = calculateCartTotal(items);

    const body = {
        transaction_amount: totalAmount,
        description: 'Produtos agrícolas',
        payment_method_id: 'pix',
        payer: {
            email: req.session.userEmail
        },
    };

    try {
        const response = await payment.create({ body });

        
        const ticketUrl = response?.point_of_interaction?.transaction_data?.ticket_url;

        if (ticketUrl) {
            console.log(`Ticket URL: ${ticketUrl}`);
            res.json({ 
                ticket_url: ticketUrl
            });
        } else {
            console.error('Erro: Ticket URL não encontrado na resposta.');
            res.status(500).json({ error: 'Não foi possível obter o link de pagamento' });
        }
    } catch (error) {
        console.error('Erro ao criar a preferência de pagamento:', error);
        res.status(500).json({ error: 'Erro ao criar a preferência de pagamento' });
    }
});

const port = 3000;
app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
});
