const express = require('express');
const cors = require('cors');
const crypto = require('crypto'); // Módulo para criptografia
const app = express();
const port = 3000;

// Configuração da chave de API
const API_KEY = '1928374756alskdjdjf'; // Chave de API

// Middleware para permitir o parsing de JSON nas requisições
app.use(express.json());

// Habilita o CORS para todas as rotas
app.use(cors());

// Middleware de autenticação de chave de API
const authenticateAPIKey = (req, res, next) => {
  const apiKey = req.header('x-api-key');

  if (!apiKey) {
    return res.status(401).json({ message: 'Chave de API ausente.' });
  }

  if (apiKey !== API_KEY) {
    return res.status(403).json({ message: 'Chave de API inválida.' });
  }

  next();
};

// Aplicando o middleware de autenticação
app.use(authenticateAPIKey);

// Função para criptografar mensagens
const encryptMessage = (message) => {
  const algorithm = 'aes-256-ctr'; // Algoritmo de criptografia
  const secretKey = crypto.randomBytes(32); // Gera uma chave secreta
  const iv = crypto.randomBytes(16); // Vetor de inicialização

  const cipher = crypto.createCipheriv(algorithm, secretKey, iv);
  const encrypted = Buffer.concat([cipher.update(message), cipher.final()]);

  return {
    iv: iv.toString('hex'),
    content: encrypted.toString('hex'),
    secretKey: secretKey.toString('hex'),
  };
};

// Função para descriptografar mensagens
const decryptMessage = (encryptedMessage) => {
  const algorithm = 'aes-256-ctr';
  const secretKey = Buffer.from(encryptedMessage.secretKey, 'hex');
  const iv = Buffer.from(encryptedMessage.iv, 'hex');
  const encryptedText = Buffer.from(encryptedMessage.content, 'hex');

  const decipher = crypto.createDecipheriv(algorithm, secretKey, iv);
  const decrypted = Buffer.concat([decipher.update(encryptedText), decipher.final()]);

  return decrypted.toString();
};

// Endpoint para criptografar uma mensagem
app.post('/encrypt', (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ message: 'Mensagem não fornecida.' });
    }
    const encryptedMessage = encryptMessage(message);
    res.status(200).json({
      iv: encryptedMessage.iv,
      content: encryptedMessage.content,
      secretKey: encryptedMessage.secretKey
    }); // Retorna o objeto completo
  } catch (error) {
    res.status(500).json({ message: 'Erro ao criptografar mensagem.' });
  }
});

// Endpoint para descriptografar uma mensagem
app.post('/decrypt', (req, res) => {
  try {
    const { iv, content, secretKey } = req.body; // Desestruturar o objeto
    if (!iv || !content || !secretKey) {
      return res.status(400).json({ message: 'Mensagem criptografada não fornecida corretamente.' });
    }

    // Cria um objeto para passar para a função de descriptografia
    const encryptedMessage = {
      iv,
      content,
      secretKey,
    };

    // Passa o objeto completo para a função de descriptografia
    const decryptedMessage = decryptMessage(encryptedMessage);
    res.status(200).json({ decryptedMessage });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao descriptografar mensagem.' });
  }
});

// Inicia o servidor
app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
