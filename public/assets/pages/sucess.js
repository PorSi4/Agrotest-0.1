window.onload = async function() {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const paymentId = urlParams.get('payment_id');

    if (paymentId) {
        try {
            // Enviar o ID do pagamento para o servidor para verificar o status
            const response = await fetch(`/verify-payment?payment_id=${paymentId}`);
            const data = await response.json();

            // Exibir o status do pagamento ou mensagem relevante
            const statusElement = document.getElementById('payment-status');
            if (data.status === 'approved') {
                statusElement.textContent = 'Pagamento aprovado!';
            } else {
                statusElement.textContent = 'O pagamento não foi aprovado.';
            }
        } catch (error) {
            console.error('Erro ao verificar o status do pagamento:', error);
            document.getElementById('payment-status').textContent = 'Ocorreu um erro ao processar o pagamento.';
        }
    } else {
        document.getElementById('payment-status').textContent = 'Nenhum ID de pagamento encontrado.';
    }
};
