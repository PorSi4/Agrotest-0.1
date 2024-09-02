import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    // Adicionar usuários
    const user = await prisma.user.create({
        data: {
            email: 'john.doe@example.com',
            password: 'hashedpassword123',
            name: 'John Doe'
        }
    });

    console.log('User created:', user);

    // Adicionar produtos
    const product1 = await prisma.product.create({
        data: {
            name: 'Soja',
            price: 12.00,
            imageUrl: 'https://example.com/soja.jpg'
        }
    });

    const product2 = await prisma.product.create({
        data: {
            name: 'Silagem',
            price: 15.00,
            imageUrl: 'https://example.com/silagem.jpg'
        }
    });

    console.log('Products created:', { product1, product2 });

    // Adicionar um pedido
    const order = await prisma.order.create({
        data: {
            userId: user.id,
            name: 'Order for John Doe',
            total: 57.00,
            address: '123 Test Avenue',
            houseNumber: '1A',
            cep: '00000-000',
            orderItems: {
                create: [
                    {
                        productId: product1.id,
                        quantity: 2
                    },
                    {
                        productId: product2.id,
                        quantity: 3
                    }
                ]
            }
        },
        include: {
            orderItems: {
                include: {
                    product: true
                }
            }
        }
    });

    console.log('Order created:', order);
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
