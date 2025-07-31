const qrcode = require('qrcode-terminal');
const { Client } = require('whatsapp-web.js');
const client = new Client({ puppeteer: { executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' } });

const categoriasValidas = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];
const categoriasMap = {
    '1': '50cc',
    '2': '65cc',
    '3': 'MX1',
    '4': 'MX2',
    '5': 'MX3',
    '6': 'MX4',
    '7': 'MX5',
    '8': 'MX2JR',
    '9': 'MXJR'
};

const delay = ms => new Promise(res => setTimeout(res, ms));
let userState = {};

client.on('qr', qr => {
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('Tudo certo! WhatsApp conectado.');
});

client.initialize();

client.on('message', async (message) => {
    const chatId = message.from;
    if (!userState[chatId]) {
        userState[chatId] = { step: 0 };
    }

    const state = userState[chatId];
    const entrada = message.body.toLowerCase().trim();
    const saudacoes = ['oi', 'olá', 'bom dia', 'boa tarde', 'boa noite'];

    if (message.body === '#sair') {
        await message.reply('Atendimento encerrado. Obrigado!');
        delete userState[chatId];
        return;
    }

    if (state.step === 0) {
        state.option = 'Motocross';
        await message.reply(`Olá, seja bem-vindo ao sistema de inscrição para a etapa do Campeonato Mineiro de Motocross que será disputada nos dias 16 e 17 de Agosto em Brumadinho.\nPor favor digite o seu nome completo.`);
        state.step = 2;
    } else if (state.step === 2) {
        if (saudacoes.includes(entrada)) {
            await message.reply('😅 Parece que você enviou uma saudação. Por favor, digite seu nome completo.');
            return;
        }

        if (!state.nomeConfirmado) {
            state.nome = message.body;
            state.nomeConfirmado = true;
            await message.reply(`Você digitou o nome: *${state.nome}*\nEsse é o seu nome completo? Responda com "sim" ou digite novamente.`);
            return;
        }

        if (entrada === 'sim') {
            await message.reply(`Perfeito! Agora, digite o seu CPF.`);
            state.step = 3;
        } else {
            state.nome = message.body;
            await message.reply(`Você digitou: *${state.nome}*\nEsse é o seu nome completo? Responda com "sim" ou digite novamente.`);
        }
    } else if (state.step === 3) {
        state.cpf = message.body;
        await message.reply(`Digite sua data de nascimento no formato DD/MM/AAAA`);
        state.step = 4;
    } else if (state.step === 4) {
        state.dataNascimento = message.body;
        await message.reply(`Digite a sua cidade`);
        state.step = 5;
    } else if (state.step === 5) {
        state.cidade = message.body;
        await message.reply(`Digite o seu estado`);
        state.step = 6;
    } else if (state.step === 6) {
        state.estado = message.body;
        await message.reply(`Digite o seu telefone`);
        state.step = 7;
    } else if (state.step === 7) {
        state.telefone = message.body;
        await message.reply(`Digite o seu Instagram, se não tiver digite "não tenho"`);
        state.step = 8;
    } else if (state.step === 8) {
        state.instagram = message.body;
        await message.reply(`Digite o número da sua moto`);
        state.step = 9;
    } else if (state.step === 9) {
        state.numMoto = message.body;
        await message.reply(`Quantas inscrições deseja fazer?`);
        state.step = 10;
    } else if (state.step === 10) {
        state.numInscricoes = parseInt(message.body);
        state.categorias = [];
        state.inscricaoAtual = 1;

        const opcoes = Object.entries(categoriasMap).map(([id, nome]) => `${id} – ${nome}`).join('\n');
        await message.reply(`Escolha a categoria para a inscrição ${state.inscricaoAtual}:\n\n${opcoes}`);
        state.step = 11;
    } else if (state.step === 11) {
        if (!categoriasValidas.includes(message.body)) {
            const opcoes = Object.entries(categoriasMap).map(([id, nome]) => `${id} – ${nome}`).join('\n');
            await message.reply(`Categoria inválida! Por favor, escolha uma opção válida:\n\n${opcoes}`);
            return;
        }

        state.categorias.push(message.body);

        if (state.inscricaoAtual < state.numInscricoes) {
            state.inscricaoAtual++;
            const opcoes = Object.entries(categoriasMap).map(([id, nome]) => `${id} – ${nome}`).join('\n');
            await message.reply(`Escolha a categoria para a inscrição ${state.inscricaoAtual}:\n\n${opcoes}`);
        } else {
            let valorTotal = state.categorias.length * 100;

            const inscricoesMsg = state.categorias.map((cat, index) =>
                `Inscrição ${index + 1}: ${categoriasMap[cat] || 'Categoria desconhecida'}`
            ).join('\n');

            console.log(`
            ----- DADOS DO USUÁRIO -----
            Nome: ${state.nome}
            CPF: ${state.cpf}
            Data de Nascimento: ${state.dataNascimento}
            Cidade: ${state.cidade}
            Estado: ${state.estado}
            Telefone: ${state.telefone}
            Instagram: ${state.instagram}
            Número da Moto: ${state.numMoto}
            Inscrições:
            ${inscricoesMsg}
            Valor total a pagar: R$ ${valorTotal},00
            ----------------------------
            `);

            await message.reply(`Inscrições realizadas:\n${inscricoesMsg}\n\nValor total a pagar: R$ ${valorTotal},00\n\nPara realizar o pagamento, faça um PIX para o CNPJ 19.748.003/0001-36 em nome de Federação de Motociclismo do Estado de Minas Gerais. Após realizar o PIX, envie o comprovante para o número 31999172117.`);
            delete userState[chatId];
        }
    }
});
